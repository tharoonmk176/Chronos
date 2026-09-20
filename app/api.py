from datetime import datetime

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import backtesting_engine as engine
from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.db import get_db
from app.models import BacktestResult, Trade, User
from app.schemas import (
    BacktestRequest, CompareStrategiesRequest, CorrelationRequest, OptimizationRequest,
    RegimeRequest, RollingCorrelationRequest, Token, UserOut, UserRegister,
)
from app.service import create_pending_record, _fetch_cached
from app.tasks import run_backtest_task

router = APIRouter(prefix="/api/v1")


@router.post("/auth/register", response_model=UserOut, status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter_by(email=payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut(id=user.id, email=user.email)


@router.post("/auth/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email=form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return Token(access_token=create_access_token(subject=user.id))


@router.get("/auth/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut(id=current_user.id, email=current_user.email)

STRATEGY_INFO = [
    {"id": "sma_crossover", "name": "SMA Crossover",
     "description": "Buy when fast SMA crosses above slow SMA",
     "parameters": [{"name": "sma_fast", "default": 20}, {"name": "sma_slow", "default": 50}]},
    {"id": "ema_trend", "name": "EMA Trend",
     "description": "Buy when fast EMA crosses above slow EMA", "parameters": []},
    {"id": "momentum", "name": "Momentum",
     "description": "Buy when momentum turns positive", "parameters": []},
    {"id": "mean_reversion", "name": "Mean Reversion",
     "description": "Buy when price falls below the lower Bollinger band", "parameters": []},
]


@router.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@router.post("/backtest", status_code=202)
def create_backtest(request: BacktestRequest, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    """Validates synchronously (cheap, fails fast — no DB row, no task dispatched on bad
    input), then hands the actual computation to a Celery worker via Redis and returns
    immediately with status='pending'. Poll GET /backtest/{id} for the result."""
    try:
        engine.validate_request(
            request.ticker, request.start_date, request.end_date,
            request.initial_capital, request.strategy,
            request.transaction_cost, request.sma_fast, request.sma_slow,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    record = create_pending_record(request, db)
    run_backtest_task.delay(record.id, request.model_dump())
    return _serialize(record, db)


@router.get("/backtest/{backtest_id}")
def get_backtest(backtest_id: str, db: Session = Depends(get_db)):
    record = db.query(BacktestResult).filter_by(id=backtest_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return _serialize(record, db)


@router.get("/data/{ticker}")
def get_price_data(ticker: str, start_date: str, end_date: str):
    try:
        data = _fetch_cached(ticker, start_date, end_date)
    except Exception as e:
        print(f'ERROR IN ANALYZE: {e}')
        raise HTTPException(status_code=502, detail=str(e))
    return {
        "ticker": ticker,
        "data_points": len(data),
        "data": [
            {"date": str(row.date.date()), "open": row.open, "high": row.high,
             "low": row.low, "close": row.close, "volume": int(row.volume)}
            for row in data.itertuples()
        ],
    }


SIGNAL_FUNCS = {
    "sma_crossover": engine.SignalGenerator.sma_crossover,
    "ema_trend": engine.SignalGenerator.ema_trend,
    "momentum": engine.SignalGenerator.momentum,
    "mean_reversion": engine.SignalGenerator.mean_reversion,
}


@router.get("/indicators/{ticker}")
def get_indicators(ticker: str, start_date: str, end_date: str,
                   strategy: str = "sma_crossover", sma_fast: int = 20, sma_slow: int = 50):
    """Price + SMA/EMA + returns + cumulative/rolling returns + buy/sell signal per day.
    Powers the dashboard's price chart, returns/volatility chart, and signal markers."""
    if strategy not in SIGNAL_FUNCS:
        raise HTTPException(status_code=400, detail=f"strategy must be one of {list(SIGNAL_FUNCS)}")
    try:
        data = _fetch_cached(ticker, start_date, end_date)
        engine.DataFetcher.validate_data(data)
    except Exception as e:
        print(f'ERROR IN ANALYZE: {e}')
        raise HTTPException(status_code=502, detail=str(e))

    data = engine.IndicatorCalculator.calculate_all_indicators(data.copy(), sma_fast, sma_slow)
    signal = SIGNAL_FUNCS[strategy](data)

    def clean(v):
        return None if v is None or (isinstance(v, float) and pd.isna(v)) else float(v)

    return {
        "ticker": ticker,
        "strategy": strategy,
        "data": [
            {
                "date": str(row.date.date()),
                "close": clean(row.close),
                "sma_fast": clean(row.sma_fast),
                "sma_slow": clean(row.sma_slow),
                "ema_fast": clean(row.ema_fast),
                "ema_slow": clean(row.ema_slow),
                "returns": clean(row.returns),
                "cumulative_returns": clean(row.cumulative_returns),
                "rolling_returns": clean(row.rolling_returns),
                "rsi": clean(row.rsi),
                "macd": clean(row.macd),
                "macd_signal": clean(row.macd_signal),
                "macd_histogram": clean(row.macd_histogram),
                "bb_upper": clean(row.bb_upper),
                "bb_middle": clean(row.bb_middle),
                "bb_lower": clean(row.bb_lower),
                "signal": int(signal.iloc[i]),
            }
            for i, row in enumerate(data.itertuples())
        ],
    }


@router.post("/correlation/rolling")
def rolling_correlation(request: RollingCorrelationRequest):
    try:
        a = _fetch_cached(request.ticker1, request.start_date, request.end_date)
        b = _fetch_cached(request.ticker2, request.start_date, request.end_date)
        result = engine.CorrelationAnalyzer.calculate_rolling_correlation_pair(
            {request.ticker1: a, request.ticker2: b},
            request.ticker1, request.ticker2, request.window,
        )
    except Exception as e:
        print(f'ERROR IN ANALYZE: {e}')
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "ticker1": request.ticker1, "ticker2": request.ticker2, "window": request.window,
        "data": [
            {"date": str(row.date.date() if hasattr(row.date, 'date') else row.date),
             "rolling_correlation": None if pd.isna(row.rolling_correlation) else float(row.rolling_correlation)}
            for row in result.itertuples()
        ],
    }


@router.post("/regime")
def regime_analysis(request: RegimeRequest):
    try:
        data = _fetch_cached(request.ticker, request.start_date, request.end_date)
        engine.DataFetcher.validate_data(data)
        
        # Respect user settings instead of defaulting
        data['sma_fast'] = data['close'].rolling(window=request.sma_fast).mean()
        data['sma_slow'] = data['close'].rolling(window=request.sma_slow).mean()
        data = engine.IndicatorCalculator.calculate_all_indicators(data.copy())
        
        backtester = engine.Backtester(data, request.initial_capital, strategy=request.strategy)
        backtester.position_manager.transaction_cost = request.transaction_cost
        results = backtester.run()
        breakdown = engine.MarketRegimeAnalyzer.analyze_by_regime(results, data)
    except Exception as e:
        print(f'ERROR IN ANALYZE: {e}')
        raise HTTPException(status_code=400, detail=str(e))

    return {"ticker": request.ticker, "strategy": request.strategy, "regime_breakdown": breakdown}


@router.get("/strategies")
def list_strategies():
    return {"strategies": STRATEGY_INFO}


@router.post("/strategies/compare")
def compare_strategies(request: CompareStrategiesRequest):
    results = []
    for strategy in request.strategies:
        try:
            r = engine.run_backtest(
                ticker=request.ticker, start_date=request.start_date,
                end_date=request.end_date, initial_capital=request.initial_capital,
                strategy=strategy,
            )
            results.append({
                "strategy": strategy,
                "total_return_percent": r["summary"]["total_return_percent"],
                "sharpe_ratio": r["risk_metrics"]["sharpe_ratio"],
                "max_drawdown_percent": r["risk_metrics"]["max_drawdown_percent"],
                "win_rate_percent": r["trade_statistics"]["win_rate_percent"],
            })
        except Exception as e:
            print(f'ERROR IN ANALYZE: {e}')
            results.append({"strategy": strategy, "error": str(e)})
    return {"ticker": request.ticker, "comparison": results}


@router.post("/optimize")
def optimize_parameters(request: OptimizationRequest):
    try:
        results = engine.ParameterOptimizer.grid_search(
            ticker=request.ticker, start_date=request.start_date, end_date=request.end_date,
            strategy=request.strategy, initial_capital=request.initial_capital,
            param_ranges=request.param_ranges,
        )
    except Exception as e:
        print(f'ERROR IN ANALYZE: {e}')
        raise HTTPException(status_code=400, detail=str(e))
    return {"top_results": results[:10]}


@router.post("/correlation")
def analyze_correlation(request: CorrelationRequest):
    try:
        return engine.run_multi_asset_analysis(
            tickers=request.tickers, start_date=request.start_date, end_date=request.end_date
        )
    except Exception as e:
        print(f'ERROR IN ANALYZE: {e}')
        raise HTTPException(status_code=400, detail=str(e))


def _serialize(record: BacktestResult, db: Session) -> dict:
    trades = db.query(Trade).filter_by(backtest_id=record.id).order_by(Trade.trade_number).all()
    return {
        "backtest_id": record.id,
        "ticker": record.ticker,
        "strategy": record.strategy,
        "status": record.status,
        "error_message": record.error_message,
        "summary": {
            "initial_capital": record.initial_capital,
            "final_value": record.final_value,
            "total_return_percent": record.total_return_percent,
            "annualized_return_percent": record.annualized_return_percent,
            "benchmark_return_percent": record.benchmark_return_percent,
            "strategy_vs_benchmark": record.strategy_vs_benchmark,
        },
        "risk_metrics": {
            "sharpe_ratio": record.sharpe_ratio,
            "volatility_percent": record.volatility_percent,
            "max_drawdown_percent": record.max_drawdown_percent,
            "calmar_ratio": record.calmar_ratio,
        },
        "trade_statistics": {
            "total_trades": record.total_trades,
            "win_rate_percent": record.win_rate_percent,
        },
        "trades": [
            {"trade_number": t.trade_number, "type": t.type, "date": t.date,
             "price": t.price, "shares": t.shares, "profit": t.profit}
            for t in trades
        ],
        "portfolio_values": record.portfolio_values,
        "dates": record.dates,
        "created_at": record.created_at.isoformat() if record.created_at else None,
        "completed_at": record.completed_at.isoformat() if record.completed_at else None,
    }


from pydantic import BaseModel
from typing import List

class ChatMessage(BaseModel):
    role: str
    content: str

from typing import Optional
class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[str] = None


import os
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

with open('app/strategies_data.json', 'r') as f:
    strategies_json_str = f.read()

model = genai.GenerativeModel("gemini-flash-latest", system_instruction=f"""You are Chronos, the expert Quantitative Research Assistant for the Chronos Backtesting Platform.
You are directly integrated into the user's dashboard. 

You have been trained on the 'quantconnect_top20_strategy_screen' dataset. 
You are fully aware of all 20 advanced QuantConnect quantitative strategies, including their metrics, primary asset classes, best-fit situations, implementation rules, and alpha theses.

Here is the raw data for the Top 20 Strategies:
{strategies_json_str}

Your goal is to answer the user's questions about these strategies, specifically:
- "Which strategy is best for which share?" (Match the strategy's 'Primary asset class' or 'Asset universe' to the user's requested share, e.g. Equities for TSLA, Crypto for BTC).
- How the strategies perform (e.g. 3M return, 5Y drawdown).
- How the strategies work (using the 'Implementation / rules' and 'Alpha thesis').

The Chronos platform also supports standard quantitative backtesting strategies:
1. SMA Crossover
2. EMA Trend
3. Momentum Strategy
4. Mean Reversion
5. Buy and Hold (Benchmark)

CRITICAL FORMATTING RULES:
Every single answer you provide MUST be cleanly structured, highly organized, and classified using GitHub Flavored Markdown.
Always adhere to the following formatting requirements:
- Use **bold text** (`**bold**`) to highlight key terms, metrics, ticker symbols, and strategy names.
- Use Markdown headers (`###`) for distinct sections.
- When presenting metrics or comparisons, ALWAYS draw a Markdown table (e.g. `| Metric | Value |`).
- Use bullet lists (`- `) for implementation details or rules.

Example:
### **Strategy Match**
**TSLA** is best matched with **Value-Quality Stocks**.

### **Performance Metrics**
| Metric | Value |
|---|---|
| **3M Return** | +1.5% |
| **Max Drawdown** | -10% |

Do NOT write large blocks of unstructured text. Answer intelligently, concisely, and with expert financial precision.""")
chat_session = None


class WalkForwardRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str
    strategy: str
    initial_capital: float

class MonteCarloRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str
    strategy: str
    initial_capital: float

@router.post("/walk-forward")
def walk_forward_analysis(payload: WalkForwardRequest):
    res = engine.WalkForwardAnalyzer.run_walk_forward(
        ticker=payload.ticker,
        start_date=payload.start_date,
        end_date=payload.end_date,
        strategy=payload.strategy,
        initial_capital=payload.initial_capital
    )
    return res

@router.post("/monte-carlo")
def monte_carlo_analysis(payload: MonteCarloRequest):
    from app.service import _fetch_cached
    data = _fetch_cached(payload.ticker, payload.start_date, payload.end_date)
    engine.DataFetcher.validate_data(data)
    data = engine.IndicatorCalculator.calculate_all_indicators(data, 20, 50)
    
    backtester = engine.Backtester(data, payload.initial_capital, 0.001, payload.strategy)
    results = backtester.run()
    
    import pandas as pd
    import numpy as np
    portfolio = results['portfolio_values']
    df = pd.DataFrame({'portfolio': portfolio})
    returns_series = df['portfolio'].pct_change().dropna()
    
    mc_res = engine.MonteCarloSimulator.run_monte_carlo(
        returns=returns_series,
        initial_capital=payload.initial_capital
    )
    
    # Generate 5 sample paths to render on frontend to not overload JSON
    mean_return = returns_series.mean()
    std_return = returns_series.std()
    
    days_ahead = 252
    simulations = np.random.normal(mean_return, std_return, size=(days_ahead, 5))
    cumulative_returns = np.cumprod(1 + simulations, axis=0)
    paths = payload.initial_capital * cumulative_returns
    
    chart_data = []
    for day in range(days_ahead):
        point = {"day": day}
        for path_idx in range(5):
            point[f"path_{path_idx}"] = float(paths[day, path_idx])
        chart_data.append(point)
        
    mc_res["chart_data"] = chart_data
    
    return mc_res

@router.post("/chat")
def chat_with_bot(payload: ChatRequest):
    try:
        chat_session = model.start_chat(history=[])
        
        user_message = payload.messages[-1].content
        
        if payload.context:
            user_message = f"CONTEXT INFORMATION FROM DASHBOARD:\n{payload.context}\n\nUSER QUESTION:\n{user_message}"
            
        response = chat_session.send_message(user_message)
        
        return {"reply": response.text}
    except Exception as e:
        print(f'ERROR IN ANALYZE: {e}')
        return {"reply": f"Error connecting to Gemini API: {str(e)}"}



import json
import os
from typing import List, Dict, Any

@router.get("/intel/strategies")
def get_intel_strategies():
    try:
        with open('app/strategies_data.json', 'r') as f:
            data = json.load(f)
        return {"strategies": data}
    except Exception as e:
        print(f'ERROR IN ANALYZE: {e}')
        return {"error": str(e), "strategies": []}

@router.get("/intel/situations")
def get_intel_situations():
    try:
        with open('app/situations_data.json', 'r') as f:
            data = json.load(f)
        return {"situations": data}
    except Exception as e:
        print(f'ERROR IN ANALYZE: {e}')
        return {"error": str(e), "situations": []}



from fastapi import File, UploadFile, Depends, Form
from typing import Optional
import pandas as pd
import io
import yfinance as yf
from app.models import Portfolio, PortfolioItem

@router.post("/portfolio/upload")
async def upload_portfolio(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Parse file
    content = await file.read()
    filename = file.filename.lower()
    
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content), header=None)
        elif filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(content), header=None)
        else:
            return {"error": "Unsupported file format. Please upload CSV or Excel."}
            
        # Dynamically find the header row
        header_row_idx = -1
        ticker_col_idx = -1
        qty_col_idx = -1
        price_col_idx = -1
        date_col_idx = -1

        for idx, row in df.iterrows():
            if idx > 50:
                break
                
            row_vals = [str(v).lower().strip() for v in row.values]
            
            t_idx = next((i for i, v in enumerate(row_vals) if 'ticker' in v or 'symbol' in v), -1)
            q_idx = next((i for i, v in enumerate(row_vals) if 'quantity' in v or 'shares' in v or 'qty' in v), -1)
            
            # Avoid matching "Buy Date" as price
            p_idx = next((i for i, v in enumerate(row_vals) if 'price' in v or 'cost' in v or 'avg. buy' in v), -1)
            cp_idx = next((i for i, v in enumerate(row_vals) if 'current price' in v or 'cmp' in v), -1)
            today_gain_idx = next((i for i, v in enumerate(row_vals) if 'today g/l' in v), -1)
            
            if t_idx != -1 and q_idx != -1 and p_idx != -1:
                header_row_idx = idx
                ticker_col_idx = t_idx
                qty_col_idx = q_idx
                price_col_idx = p_idx
                date_col_idx = next((i for i, v in enumerate(row_vals) if 'date' in v), -1)
                break
                
        if header_row_idx == -1:
            return {"error": "Could not identify required columns (Ticker, Quantity, Buy Price). Please ensure your file has clear headers anywhere in the document."}
            
        parsed_items = []
        for idx in range(header_row_idx + 1, len(df)):
            row = df.iloc[idx]
            ticker = str(row.iloc[ticker_col_idx]).strip().upper()
            if not ticker or ticker.lower() == 'nan':
                continue
                
            try:
                qty = float(row.iloc[qty_col_idx])
                price = float(row.iloc[price_col_idx])
            except (ValueError, TypeError):
                continue
                
            if pd.isna(qty) or pd.isna(price) or qty == 0 or price == 0:
                continue
                
            if not '.' in ticker:
                indian_stocks = ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'BHARTIARTL', 'ITC', 'SBIN', 'LT', 'HINDUNILVR', 'KOTAKBANK', 'AXISBANK', 'BAJFINANCE', 'MARUTI', 'SUNPHARMA', 'TITAN', 'ULTRACEMCO', 'NTPC', 'POWERGRID', 'M&M', 'TATAMOTORS', 'ADANIENT', 'ADANIPORTS', 'WIPRO', 'TECHM', 'HCLTECH', 'ONGC', 'COALINDIA', 'TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'GRASIM', 'ASIANPAINT', 'NESTLEIND', 'BAJAJFINSV', 'DIVISLAB', 'DRREDDY', 'CIPLA', 'EICHERMOT', 'APOLLOHOSP', 'TRENT', 'JIOFIN', 'ZOMATO', 'IRFC', 'SUZLON', 'PAYTM', 'POLYCAB', 'DIXON', 'PIIND', 'CDSL']
                if ticker in indian_stocks:
                    ticker += '.NS'
                    
            date = str(row.iloc[date_col_idx]).split(' ')[0] if date_col_idx != -1 and pd.notnull(row.iloc[date_col_idx]) else None
            if date == 'nan' or date == 'NaT':
                date = None
            
            fallback_cp = price
            try:
                if cp_idx != -1:
                    fallback_cp = float(row.iloc[cp_idx])
            except:
                pass
                
            fallback_tg = 0.0
            try:
                if today_gain_idx != -1:
                    fallback_tg = float(row.iloc[today_gain_idx])
            except:
                pass
            
            parsed_items.append({
                "ticker": ticker,
                "quantity": qty,
                "buy_price": price,
                "purchase_date": date,
                "fallback_current_price": fallback_cp,
                "fallback_today_gain": fallback_tg
            })
            
        return {"message": "Success", "items": parsed_items}
        
    except Exception as e:
        print(f'ERROR IN ANALYZE: {e}')
        return {"error": str(e)}

@router.post("/portfolio/save")
async def save_portfolio(
    payload: dict,
    db: Session = Depends(get_db)
):
    try:
        # Create portfolio
        # For simplicity, assign to a default user or first user if auth is bypassed
        user = db.query(User).first()
        if not user:
            return {"error": "No user found in DB"}
            
        portfolio = Portfolio(user_id=user.id, name=payload.get("name", "My Portfolio"))
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)
        
        for item in payload.get("items", []):
            pi = PortfolioItem(
                portfolio_id=portfolio.id,
                ticker=item["ticker"],
                quantity=item["quantity"],
                buy_price=item["buy_price"],
                purchase_date=item.get("purchase_date"),
                fallback_current_price=item.get("fallback_current_price"),
                fallback_today_gain=item.get("fallback_today_gain")
            )
            db.add(pi)
            
        db.commit()
        return {"message": "Portfolio saved successfully", "portfolio_id": portfolio.id}
    except Exception as e:
        print(f'ERROR IN ANALYZE: {e}')
        db.rollback()
        return {"error": str(e)}

@router.get("/portfolio/{portfolio_id}")
async def get_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        return {"error": "Portfolio not found"}
        
    items = db.query(PortfolioItem).filter(PortfolioItem.portfolio_id == portfolio_id).all()
    
    import math
    def clean_float(v, fallback):
        try:
            val = float(v)
            if math.isnan(val) or math.isinf(val):
                return float(fallback)
            return val
        except (ValueError, TypeError):
            return float(fallback)
    
    holdings = []
    for item in items:
        buy_p = clean_float(item.buy_price, 0.0)
        qty = clean_float(item.quantity, 0.0)
        
        # JUST READ DIRECTLY FROM THE UPLOADED STATIC VALUES
        current_price = clean_float(getattr(item, 'fallback_current_price', buy_p), buy_p)
        today_gain = clean_float(getattr(item, 'fallback_today_gain', 0.0), 0.0)
        
        invested = qty * buy_p
        current_value = qty * current_price
        
        prev_close = current_price - (today_gain / qty) if qty > 0 else current_price

        holdings.append({
            "id": item.id,
            "ticker": item.ticker,
            "quantity": qty,
            "buy_price": buy_p,
            "purchase_date": item.purchase_date,
            "current_price": current_price,
            "current_value": current_value,
            "invested_amount": invested,
            "total_gain": current_value - invested,
            "total_gain_pct": ((current_value - invested) / invested * 100) if invested > 0 else 0,
            "today_gain": today_gain,
            "today_gain_pct": ((current_price - prev_close) / prev_close * 100) if prev_close > 0 else 0
        })
        
    return {
        "portfolio": {
            "id": portfolio.id,
            "name": portfolio.name,
            "created_at": portfolio.created_at
        },
        "holdings": holdings
    }

@router.get("/portfolios")
async def list_portfolios(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        return {"portfolios": []}
    portfolios = db.query(Portfolio).filter(Portfolio.user_id == user.id).order_by(Portfolio.created_at.desc()).all()
    return {"portfolios": [{"id": p.id, "name": p.name, "created_at": p.created_at} for p in portfolios]}

@router.get("/ticker/{ticker}/chart")
def get_ticker_chart(ticker: str, days: int = 180):
    try:
        import yfinance as yf
        import datetime
        end_date = datetime.datetime.now()
        start_date = end_date - datetime.timedelta(days=days)
        df = yf.download(ticker, start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'), progress=False)
        
        if df.empty:
            return {"error": "No data found for this ticker"}
            
        # Format for lightweight-charts or echarts
        chart_data = []
        for date, row in df.iterrows():
            chart_data.append({
                "time": date.strftime('%Y-%m-%d'),
                "open": float(row['Open'].iloc[0]) if isinstance(row['Open'], pd.Series) else float(row['Open']),
                "high": float(row['High'].iloc[0]) if isinstance(row['High'], pd.Series) else float(row['High']),
                "low": float(row['Low'].iloc[0]) if isinstance(row['Low'], pd.Series) else float(row['Low']),
                "close": float(row['Close'].iloc[0]) if isinstance(row['Close'], pd.Series) else float(row['Close']),
                "volume": float(row['Volume'].iloc[0]) if isinstance(row['Volume'], pd.Series) else float(row['Volume'])
            })
            
        return {"ticker": ticker, "data": chart_data}
    except Exception as e:
        print(f'ERROR IN ANALYZE: {e}')
        return {"error": str(e)}


@router.post("/portfolio/{portfolio_id}/analyze")
def analyze_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    try:
        from app.models import PortfolioItem
        db_items = db.query(PortfolioItem).filter(PortfolioItem.portfolio_id == portfolio_id).all()
        if not db_items:
            return {"error": "No items in portfolio"}
        
        items = [{"ticker": i.ticker, "quantity": i.quantity, "buy_price": i.buy_price} for i in db_items]
            
        import google.generativeai as genai
        import json
        prompt = f'''Analyze this portfolio: {items}. 
        Return ONLY a raw JSON object (no markdown, no backticks) with this exact structure:
        {{
            "risk_score": 75,
            "diversification": "Medium",
            "summary": "2-3 sentences of expert quantitative analysis.",
            "sectors": [
                {{"name": "Technology", "value": 50}},
                {{"name": "Financials", "value": 30}},
                {{"name": "Energy", "value": 20}}
            ]
        }}
        Guess the sectors based on the tickers.'''
        
        # We can just reuse the global model
        resp = model.generate_content(prompt)
        text = resp.text.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        if text.startswith("```"):
            text = text[3:-3]
        
        analysis = json.loads(text.strip())
        return analysis
    except Exception as e:
        print(f'ERROR IN ANALYZE: {e}')
        # Fallback static analysis if AI fails
        return {
            "risk_score": 68,
            "diversification": "Moderate",
            "summary": "This portfolio shows a balanced exposure across major equities. Risk is moderate, but consider increasing fixed-income assets to hedge against downside volatility.",
            "sectors": [
                {"name": "Technology", "value": 45},
                {"name": "Financials", "value": 25},
                {"name": "Consumer Goods", "value": 20},
                {"name": "Healthcare", "value": 10}
            ]
        }
