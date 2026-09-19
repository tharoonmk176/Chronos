# Complete End-to-End Pipeline & Building Process

## Table of Contents
1. [Project Timeline](#project-timeline)
2. [Phase-by-Phase Development](#phase-by-phase-development)
3. [Week-by-Week Breakdown](#week-by-week-breakdown)
4. [Core Modules to Build](#core-modules-to-build)
5. [Complete Data Pipeline](#complete-data-pipeline)
6. [Integration Steps](#integration-steps)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Checklist](#deployment-checklist)

---

## Project Timeline

### High-Level Overview

```
Hackathon Duration: 5 Days
├─ Day 1-2: Core backend modules (backtesting engine)
├─ Day 2-3: API & data integration
├─ Day 3-4: Frontend & visualization
├─ Day 4-5: Testing, optimization, polish
└─ Day 5: Final deployment & presentation
```

### Detailed Gantt

```
Day 1 (Setup & Core Logic):
├─ 08:00-10:00: Environment setup, project structure
├─ 10:00-14:00: Build indicator calculator (SMA, EMA, returns, etc.)
├─ 14:00-18:00: Build signal generator (4 strategies)
└─ 18:00-20:00: Build position manager & metrics calculator

Day 2 (Backtesting Engine):
├─ 08:00-12:00: Complete backtester main engine
├─ 12:00-16:00: Test backtester with sample data
├─ 16:00-20:00: Build data fetcher & correlations

Day 3 (API & Database):
├─ 08:00-11:00: Setup FastAPI, SQLAlchemy, database
├─ 11:00-14:00: Build API endpoints (/backtest, /data, /strategies)
├─ 14:00-18:00: Implement services layer (orchestration)
└─ 18:00-20:00: Add caching & error handling

Day 4 (Frontend & Integration):
├─ 08:00-12:00: React setup, basic dashboard
├─ 12:00-15:00: Chart visualization (price, portfolio, signals)
├─ 15:00-19:00: Parameter controls, results display
└─ 19:00-21:00: Integration testing (backend ↔ frontend)

Day 5 (Polish & Deployment):
├─ 08:00-12:00: Bug fixes, performance optimization
├─ 12:00-15:00: Add documentation, example usage
├─ 15:00-17:00: Deploy (Railway, Vercel, or Heroku)
└─ 17:00-20:00: Final testing & presentation prep
```

---

## Phase-by-Phase Development

### PHASE 1: CORE COMPUTATION (Days 1-2)

#### Objectives
- Build all calculation engines independently
- No database yet, just Python classes
- Test with sample data
- Ensure correctness of results

#### Modules to Build

**1.1 Indicator Calculator**
```
Location: app/core/indicators.py

Implements:
├─ calculate_sma(data, period) → Series
├─ calculate_ema(data, period) → Series
├─ calculate_returns(data) → Series
├─ calculate_volatility(returns) → float
├─ calculate_sharpe_ratio(returns) → float
├─ calculate_max_drawdown(portfolio_values) → tuple
├─ calculate_correlation(returns1, returns2) → float
└─ calculate_all_indicators() → DataFrame

Test Data:
├─ Download 2 years Bitcoin data
├─ Test each indicator independently
├─ Compare with manual calculations
└─ Verify edge cases (null values, single data point)

Expected Output Format:
│ date       │ open   │ high   │ low    │ close  │ sma_20 │ ema_12 │ returns │
├─────────────┼────────┼────────┼────────┼────────┼────────┼────────┼─────────┤
│ 2023-01-01 │ 41234  │ 42000  │ 41000  │ 41800  │   NaN  │   NaN  │    NaN  │
│ 2023-01-20 │ 42100  │ 42500  │ 41900  │ 42200  │ 41965  │ 42050  │  0.0096 │
```

**1.2 Signal Generator**
```
Location: app/core/signals.py

Implements 4 Strategies:

1. SMA Crossover
   Input: DataFrame with sma_fast, sma_slow
   Output: Series with signals (1=BUY, -1=SELL, 0=HOLD)
   Logic: 
   ├─ if sma_fast > sma_slow (yesterday) AND sma_fast < sma_slow (today) → SELL
   └─ if sma_fast < sma_slow (yesterday) AND sma_fast > sma_slow (today) → BUY

2. EMA Trend
   Similar to SMA but with EMA
   
3. Momentum
   Input: DataFrame with close prices
   Output: Series with momentum signals
   Logic: momentum = current_price - price_14_days_ago
   
4. Mean Reversion
   Input: DataFrame with close prices
   Output: Series with signals based on Bollinger Bands
   Logic:
   ├─ Upper Band = SMA + (2 × StdDev)
   ├─ Lower Band = SMA - (2 × StdDev)
   ├─ if price < lower_band → BUY (oversold)
   └─ if price > upper_band → SELL (overbought)

Test:
├─ Generate signals for each strategy
├─ Verify no look-ahead bias (signals only use past data)
├─ Compare signal timing across strategies
└─ Visualize signals on price chart
```

**1.3 Position Manager**
```
Location: app/core/position_manager.py

Class: PositionManager

Attributes:
├─ cash: float (available cash)
├─ position_size: float (current shares held)
├─ trades: list (all executed trades)
└─ transaction_cost: float (0.001 = 0.1% fee)

Methods:

1. calculate_position_size(price, risk_percent)
   Example: capital=$10k, risk=95%, price=$100
   Shares = (10000 × 0.95) / 100 = 95 shares
   
2. execute_buy(date, price, shares)
   ├─ cost = shares × price × (1 + fee)
   ├─ if cost > cash: REJECT (not enough money)
   ├─ cash -= cost
   ├─ position_size = shares
   └─ record trade (entry_date, price, shares, cost)
   
3. execute_sell(date, price)
   ├─ if position_size == 0: REJECT (no shares to sell)
   ├─ proceeds = shares × price × (1 - fee)
   ├─ profit = proceeds - entry_cost
   ├─ cash += proceeds
   ├─ position_size = 0
   └─ record trade (exit_date, price, profit)
   
4. get_portfolio_value(current_price)
   return = cash + (position_size × current_price)

Test:
├─ Simulate multiple trades
├─ Verify cash calculations with fees
├─ Check position sizing
└─ Verify trade recording
```

**1.4 Metrics Calculator**
```
Location: app/core/metrics.py

Functions:

1. calculate_total_return(initial, final)
   return_pct = ((final - initial) / initial) × 100

2. calculate_annualized_return(total_return, years)
   annualized = ((final/initial) ^ (1/years)) - 1

3. calculate_volatility(returns)
   daily_volatility = std_dev(daily_returns)
   annualized = daily_volatility × √252

4. calculate_sharpe_ratio(returns, risk_free_rate)
   excess_return = mean(returns) × 252 - risk_free_rate
   sharpe = excess_return / volatility

5. calculate_max_drawdown(portfolio_values)
   running_max = cumulative maximum
   drawdown = (value - running_max) / running_max
   max_dd = minimum drawdown value
   return (max_dd%, peak_date, trough_date)

6. calculate_win_rate(trades)
   winning = count(profit > 0)
   win_rate = (winning / total) × 100

7. analyze_trades(trades)
   return {
       total_trades: int,
       winning_trades: int,
       losing_trades: int,
       win_rate: float,
       avg_profit: float,
       best_trade: float,
       worst_trade: float,
       total_profit: float
   }

Test:
├─ Manual calculation vs function
├─ Edge cases (0 trades, all wins, all losses)
└─ Compare with Excel/benchmark
```

#### Expected Outcomes After Phase 1
✅ All calculations are correct
✅ Can generate signals without errors
✅ Trade execution logic works
✅ Metrics match manual calculations
✅ Ready for integration into backtester

---

### PHASE 2: BACKTESTING ENGINE (Day 2)

#### Objectives
- Combine all modules into one simulation
- Run complete backtest on historical data
- Verify results are realistic
- Optimize for speed

#### 2.1 Main Backtester Module

```
Location: app/core/backtester.py

Class: Backtester

__init__(data, initial_capital, strategy, parameters):
    ├─ self.data = data (DataFrame with prices)
    ├─ self.initial_capital = initial_capital
    ├─ self.strategy = strategy (string)
    ├─ self.position_mgr = PositionManager(initial_capital)
    └─ self.portfolio_values = []

def run() → BacktestResult:
    
    Step 1: Validate input
    ├─ Check dates are valid
    ├─ Verify data has sufficient length
    └─ Confirm strategy exists
    
    Step 2: Calculate indicators
    ├─ Call IndicatorCalculator.calculate_all_indicators()
    └─ Add columns to data (sma, ema, returns, etc.)
    
    Step 3: Generate signals
    ├─ Call SignalGenerator based on strategy
    ├─ Add 'signal' column to data
    └─ Verify no look-ahead (only use past data)
    
    Step 4: Execute trades
    For each day in data (i = 0 to len(data)-1):
        current_price = data['close'].iloc[i]
        signal = data['signal'].iloc[i]
        
        if signal == 1 AND position_size == 0:  # BUY
            shares = position_mgr.calculate_position_size(price, 0.95)
            position_mgr.execute_buy(date, price, shares)
        
        elif signal == -1 AND position_size > 0:  # SELL
            position_mgr.execute_sell(date, price)
        
        # Record portfolio value
        portfolio_value = position_mgr.get_portfolio_value(price)
        self.portfolio_values.append(portfolio_value)
    
    Step 5: Calculate metrics
    ├─ Total return
    ├─ Annualized return
    ├─ Volatility
    ├─ Sharpe ratio
    ├─ Max drawdown
    ├─ Win rate
    └─ Trade statistics
    
    Step 6: Calculate benchmark (Buy & Hold)
    ├─ benchmark_return = (last_price - first_price) / first_price
    ├─ benchmark_value = initial_capital × (1 + benchmark_return)
    └─ strategy_vs_benchmark = strategy_return - benchmark_return
    
    Step 7: Package results
    return {
        summary: {...metrics...},
        risk_metrics: {...},
        trade_stats: {...},
        trades: [...],
        portfolio_values: [...],
        dates: [...]
    }

Testing Strategy:
├─ Test 1: Simple SMA Crossover (most intuitive)
│  ├─ Use Bitcoin 2023 data
│  ├─ 20-day / 50-day MA
│  ├─ Manual verification of first 3 trades
│  └─ Check portfolio value calculation
│
├─ Test 2: Compare to benchmark
│  ├─ Run buy-and-hold
│  ├─ Compare with strategy return
│  └─ Verify strategy > or < benchmark
│
├─ Test 3: Edge cases
│  ├─ No trades (strategy never signals)
│  ├─ One trade (buy and sell once)
│  ├─ Many trades (daily signals)
│  └─ Negative returns (losses)
│
└─ Test 4: Different strategies
   ├─ Run all 4 strategies
   ├─ Compare returns & risk
   └─ Verify each makes sense
```

#### Expected Outputs

```python
# Example output structure
{
    'summary': {
        'strategy': 'sma_crossover',
        'initial_capital': 10000,
        'final_value': 12450.50,
        'total_return_percent': 24.50,
        'annualized_return': 11.20,
        'benchmark_return': 8.50,
        'strategy_vs_benchmark': 16.00
    },
    'risk_metrics': {
        'volatility': 0.18,
        'sharpe_ratio': 1.80,
        'max_drawdown': -0.153,
        'max_drawdown_from': '2023-06-15',
        'max_drawdown_to': '2023-07-10'
    },
    'trade_stats': {
        'total_trades': 30,
        'winning_trades': 18,
        'losing_trades': 12,
        'win_rate': 60.0,
        'avg_profit': 136.4,
        'best_trade': 850.25,
        'worst_trade': -420.50,
        'total_profit': 4092.0
    },
    'trades': [
        {
            'trade_num': 1,
            'entry_date': '2023-01-15',
            'entry_price': 41234.50,
            'exit_date': '2023-02-20',
            'exit_price': 42100.00,
            'shares': 0.2318,
            'profit': 865.50,
            'profit_percent': 2.10
        },
        # ... more trades
    ],
    'portfolio_values': [10000, 10050, 10100, ...],  # Daily values
    'dates': ['2023-01-01', '2023-01-02', ...]
}
```

#### Expected Outcomes After Phase 2
✅ Backtester runs without errors
✅ Results are realistic (strategy beats benchmark or makes sense)
✅ Can run all 4 strategies
✅ Portfolio value calculation is accurate
✅ Ready for API integration

---

### PHASE 3: DATA & API LAYER (Day 3)

#### Objectives
- Setup database & API framework
- Integrate data fetching
- Create API endpoints
- Add services layer for orchestration

#### 3.1 Database Setup

```
Location: app/db/database.py, app/models/

Steps:
1. Install PostgreSQL or SQLite
2. Setup SQLAlchemy connection
3. Define models (backtest_results, trades, price_data)
4. Create tables via migration

// database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql://user:pass@localhost/fintech"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

// models/backtest.py
from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime

class BacktestResult(Base):
    __tablename__ = "backtest_results"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    ticker = Column(String, nullable=False)
    strategy = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    initial_capital = Column(Float, nullable=False)
    final_value = Column(Float, nullable=False)
    total_return = Column(Float, nullable=False)
    total_return_percent = Column(Float, nullable=False)
    sharpe_ratio = Column(Float, nullable=False)
    max_drawdown = Column(Float, nullable=False)
    status = Column(String, default='pending')
    parameters = Column(JSONB, nullable=False)
    portfolio_values = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class Trade(Base):
    __tablename__ = "trades"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    backtest_id = Column(UUID, ForeignKey("backtest_results.id"))
    entry_date = Column(Date, nullable=False)
    entry_price = Column(Float, nullable=False)
    exit_date = Column(Date, nullable=True)
    exit_price = Column(Float, nullable=True)
    shares = Column(Float, nullable=False)
    profit = Column(Float, nullable=True)
```

#### 3.2 Services Layer

```
Location: app/services/

Implements orchestration between API and core modules

// backtest_service.py
class BacktestService:
    
    def __init__(self, db: Session, cache: Redis):
        self.db = db
        self.cache = cache
    
    def validate_request(self, request: BacktestRequest) -> bool:
        """Validate input parameters"""
        if request.start_date >= request.end_date:
            raise ValueError("start_date must be before end_date")
        
        if request.initial_capital <= 0:
            raise ValueError("initial_capital must be positive")
        
        if request.strategy not in ['sma_crossover', 'ema_trend', 'momentum', 'mean_reversion']:
            raise ValueError("Unknown strategy")
        
        return True
    
    def execute(self, request: BacktestRequest) -> BacktestResult:
        """Main backtest orchestration"""
        
        # 1. Validate
        self.validate_request(request)
        
        # 2. Save to DB (status: pending)
        db_record = BacktestResultModel(
            ticker=request.ticker,
            strategy=request.strategy,
            start_date=request.start_date,
            end_date=request.end_date,
            initial_capital=request.initial_capital,
            status='pending',
            parameters=request.parameters.dict()
        )
        self.db.add(db_record)
        self.db.commit()
        
        try:
            # 3. Fetch data
            data = self.data_service.fetch_data(
                request.ticker,
                request.start_date,
                request.end_date
            )
            
            # 4. Validate data
            if len(data) < 50:
                raise ValueError("Insufficient data")
            
            # 5. Run backtest
            backtester = Backtester(
                data=data,
                initial_capital=request.initial_capital,
                strategy=request.strategy,
                parameters=request.parameters
            )
            results = backtester.run()
            
            # 6. Save results to DB
            db_record.final_value = results['summary']['final_portfolio_value']
            db_record.total_return_percent = results['summary']['total_return_percent']
            db_record.sharpe_ratio = results['risk_metrics']['sharpe_ratio']
            db_record.max_drawdown = results['risk_metrics']['max_drawdown']
            db_record.portfolio_values = results['portfolio_values']
            db_record.status = 'completed'
            db_record.completed_at = datetime.utcnow()
            
            # Save trades
            for trade in results['trades']:
                trade_record = TradeModel(
                    backtest_id=db_record.id,
                    **trade
                )
                self.db.add(trade_record)
            
            self.db.commit()
            
            return results
        
        except Exception as e:
            db_record.status = 'failed'
            db_record.error_message = str(e)
            self.db.commit()
            raise

// data_service.py
class DataService:
    
    def __init__(self, cache: Redis):
        self.cache = cache
    
    def fetch_data(self, ticker: str, start_date: str, end_date: str) -> DataFrame:
        """Fetch with caching"""
        
        # 1. Check cache
        cache_key = f"price_data:{ticker}:{start_date}:{end_date}"
        cached = self.cache.get(cache_key)
        if cached:
            return pd.read_json(cached)
        
        # 2. Fetch from API
        data = yf.download(ticker, start=start_date, end=end_date)
        
        # 3. Validate
        self.validate_data(data)
        
        # 4. Normalize
        data = self.normalize_data(data)
        
        # 5. Cache (24 hours)
        self.cache.setex(cache_key, 86400, data.to_json())
        
        return data
    
    def validate_data(self, data: DataFrame) -> bool:
        """Check data quality"""
        if len(data) < 50:
            raise ValueError("Insufficient data points")
        
        if data['close'].isnull().any():
            raise ValueError("Data contains null values")
        
        return True
    
    def normalize_data(self, data: DataFrame) -> DataFrame:
        """Handle gaps, outliers"""
        data = data.reset_index()
        data['date'] = pd.to_datetime(data['Date'])
        data = data[['date', 'Open', 'High', 'Low', 'Close', 'Volume']]
        data.columns = ['date', 'open', 'high', 'low', 'close', 'volume']
        data = data.sort_values('date')
        
        # Forward fill missing days (weekends, holidays)
        data = data.set_index('date').asfreq('D').fillna(method='ffill').reset_index()
        
        return data
```

#### 3.3 API Endpoints

```
Location: app/api/v1/

// backtest.py (endpoints)
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.schemas import BacktestRequest, BacktestResponse

router = APIRouter(prefix="/api/v1", tags=["backtest"])

@router.post("/backtest", status_code=202)
async def create_backtest(request: BacktestRequest, background_tasks: BackgroundTasks):
    """Submit a backtest job"""
    
    service = BacktestService(db, cache)
    try:
        # Run in background for long backtests
        result = service.execute(request)
        return {"backtest_id": result.id, "status": "completed"}
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/backtest/{backtest_id}")
async def get_backtest(backtest_id: str):
    """Get backtest results"""
    
    db = SessionLocal()
    record = db.query(BacktestResultModel).filter_by(id=backtest_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    if record.status == 'pending':
        return {"status": "pending", "message": "Still processing..."}
    
    if record.status == 'failed':
        return {"status": "failed", "error": record.error_message}
    
    # Fetch trades from DB
    trades = db.query(TradeModel).filter_by(backtest_id=backtest_id).all()
    
    return {
        "backtest_id": backtest_id,
        "summary": {
            "strategy": record.strategy,
            "final_value": record.final_value,
            "total_return_percent": record.total_return_percent,
            "sharpe_ratio": record.sharpe_ratio,
            "max_drawdown": record.max_drawdown
        },
        "trades": [t.to_dict() for t in trades],
        "portfolio_values": json.loads(record.portfolio_values),
        "status": "completed"
    }

// data.py
@router.get("/data/{ticker}")
async def get_price_data(ticker: str, start_date: str, end_date: str):
    """Get historical price data"""
    
    data_service = DataService(cache)
    data = data_service.fetch_data(ticker, start_date, end_date)
    
    return {
        "ticker": ticker,
        "data_points": len(data),
        "data": data.to_dict(orient='records')
    }

// strategies.py
@router.get("/strategies")
async def list_strategies():
    """List available strategies"""
    return {
        "strategies": [
            {
                "id": "sma_crossover",
                "name": "SMA Crossover",
                "description": "Buy when fast SMA crosses above slow SMA",
                "parameters": [
                    {"name": "sma_fast", "type": "integer", "default": 20},
                    {"name": "sma_slow", "type": "integer", "default": 50}
                ]
            },
            # ... other strategies
        ]
    }

@router.post("/strategies/compare")
async def compare_strategies(request: CompareStrategiesRequest):
    """Run and compare multiple strategies"""
    
    results = []
    
    for strategy in request.strategies:
        backtest_request = BacktestRequest(
            ticker=request.ticker,
            start_date=request.start_date,
            end_date=request.end_date,
            initial_capital=request.initial_capital,
            strategy=strategy
        )
        
        service = BacktestService(db, cache)
        result = service.execute(backtest_request)
        
        results.append({
            "strategy": strategy,
            "return": result['summary']['total_return_percent'],
            "sharpe": result['risk_metrics']['sharpe_ratio'],
            "drawdown": result['risk_metrics']['max_drawdown']
        })
    
    return {"comparison": results}

// correlation.py
@router.get("/correlation")
async def get_correlation(tickers: str, start_date: str, end_date: str):
    """Get correlation matrix"""
    
    tickers_list = tickers.split(',')
    assets_data = {}
    
    for ticker in tickers_list:
        data = data_service.fetch_data(ticker, start_date, end_date)
        assets_data[ticker] = data
    
    analytics = AnalyticsService()
    corr_matrix = analytics.calculate_correlation(assets_data)
    
    return {
        "tickers": tickers_list,
        "correlation_matrix": corr_matrix.to_dict()
    }
```

#### Expected Outcomes After Phase 3
✅ Database stores all results
✅ API can run backtests
✅ Results persist in database
✅ Data caching working
✅ Ready for frontend integration

---

### PHASE 4: FRONTEND & INTEGRATION (Day 4)

#### Objectives
- Build React dashboard
- Integrate with backend
- Display charts & results
- Create parameter controls

#### 4.1 Frontend Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Dashboard.js         # Main page
│   │   ├── Results.js           # Backtest results
│   │   └── Analysis.js          # Multi-asset analysis
│   │
│   ├── components/
│   │   ├── BacktestForm.js      # Input parameters
│   │   ├── StrategyComparison.js # Compare strategies
│   │   ├── Charts/
│   │   │   ├── PriceChart.js    # Price + indicators
│   │   │   ├── PortfolioChart.js # Portfolio value
│   │   │   ├── SignalsChart.js  # Buy/sell signals
│   │   │   └── CorrelationHeatmap.js
│   │   │
│   │   ├── ResultsTable.js      # Performance metrics
│   │   └── TradesList.js        # Individual trades
│   │
│   ├── api/
│   │   └── client.js            # API calls (axios)
│   │
│   ├── utils/
│   │   ├── formatters.js        # Format numbers
│   │   ├── colors.js            # Color schemes
│   │   └── helpers.js           # Utility functions
│   │
│   └── App.js                   # Main app
```

#### 4.2 Key Components

```jsx
// BacktestForm.js - Main input component
import React, { useState } from 'react';
import axios from 'axios';

function BacktestForm() {
    const [formData, setFormData] = useState({
        ticker: 'BTC-USD',
        startDate: '2023-01-01',
        endDate: '2024-01-01',
        initialCapital: 10000,
        strategy: 'sma_crossover',
        smaFast: 20,
        smaSlow: 50,
        transactionCost: 0.001
    });
    
    const [loading, setLoading] = useState(false);
    const [backtestId, setBacktestId] = useState(null);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Submit backtest request
            const response = await axios.post(
                'http://localhost:8000/api/v1/backtest',
                {
                    ticker: formData.ticker,
                    start_date: formData.startDate,
                    end_date: formData.endDate,
                    initial_capital: formData.initialCapital,
                    strategy: formData.strategy,
                    transaction_cost: formData.transactionCost,
                    parameters: {
                        sma_fast: formData.smaFast,
                        sma_slow: formData.smaSlow
                    }
                }
            );
            
            setBacktestId(response.data.backtest_id);
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Ticker" 
                   value={formData.ticker}
                   onChange={(e) => setFormData({...formData, ticker: e.target.value})} />
            
            <input type="date" 
                   value={formData.startDate}
                   onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
            
            <input type="number" placeholder="Initial Capital" 
                   value={formData.initialCapital}
                   onChange={(e) => setFormData({...formData, initialCapital: e.target.value})} />
            
            <select value={formData.strategy}
                    onChange={(e) => setFormData({...formData, strategy: e.target.value})}>
                <option value="sma_crossover">SMA Crossover</option>
                <option value="ema_trend">EMA Trend</option>
                <option value="momentum">Momentum</option>
                <option value="mean_reversion">Mean Reversion</option>
            </select>
            
            <button type="submit" disabled={loading}>
                {loading ? 'Running...' : 'Run Backtest'}
            </button>
        </form>
    );
}

export default BacktestForm;

// PriceChart.js - Chart visualization
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis } from 'recharts';

function PriceChart({ backtestId }) {
    const [chartData, setChartData] = useState([]);
    
    useEffect(() => {
        // Fetch backtest results
        axios.get(`http://localhost:8000/api/v1/backtest/${backtestId}`)
            .then(response => {
                // Format data for chart
                const formatted = response.data.portfolio_values.map((val, idx) => ({
                    date: response.data.dates[idx],
                    price: val,
                    signal: response.data.trades.find(t => t.date === response.data.dates[idx])
                }));
                
                setChartData(formatted);
            });
    }, [backtestId]);
    
    return (
        <LineChart width={800} height={400} data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Line type="monotone" dataKey="price" stroke="#8884d8" />
        </LineChart>
    );
}

export default PriceChart;

// ResultsTable.js - Performance metrics
import React from 'react';

function ResultsTable({ results }) {
    if (!results) return <div>No results yet</div>;
    
    return (
        <table>
            <tbody>
                <tr>
                    <td>Initial Capital</td>
                    <td>${results.summary.initial_capital}</td>
                </tr>
                <tr>
                    <td>Final Value</td>
                    <td>${results.summary.final_portfolio_value}</td>
                </tr>
                <tr>
                    <td>Total Return</td>
                    <td>{results.summary.total_return_percent}%</td>
                </tr>
                <tr>
                    <td>Sharpe Ratio</td>
                    <td>{results.risk_metrics.sharpe_ratio}</td>
                </tr>
                <tr>
                    <td>Max Drawdown</td>
                    <td>{results.risk_metrics.max_drawdown_percent}%</td>
                </tr>
                <tr>
                    <td>Total Trades</td>
                    <td>{results.trade_statistics.total_trades}</td>
                </tr>
                <tr>
                    <td>Win Rate</td>
                    <td>{results.trade_statistics.win_rate_percent}%</td>
                </tr>
            </tbody>
        </table>
    );
}

export default ResultsTable;
```

#### 4.3 Integration Flow

```
User submits form
    ↓
POST /api/v1/backtest
    ↓
Backend: validate, fetch data, calculate, save to DB
    ↓
Return backtest_id (202 Accepted)
    ↓
Frontend: Poll GET /api/v1/backtest/{id} every 2 seconds
    ↓
Status: pending → completed
    ↓
Render results, charts, metrics
    ↓
Display portfolio value over time
Display buy/sell signals on price chart
Display trade list
Display risk metrics
```

#### Expected Outcomes After Phase 4
✅ Frontend loads
✅ Can submit backtest from UI
✅ Results display properly
✅ Charts render correctly
✅ Can compare strategies

---

### PHASE 5: TESTING & DEPLOYMENT (Day 5)

#### Objectives
- Test entire system
- Fix bugs
- Optimize performance
- Deploy to production

#### 5.1 Testing Checklist

```
Unit Tests:
├─ Indicator calculations (vs manual)
├─ Signal generation (no look-ahead)
├─ Position manager (trade execution)
├─ Metrics (Sharpe, drawdown, etc.)
└─ Each strategy (results make sense)

Integration Tests:
├─ API endpoints (request/response)
├─ Database persistence
├─ Cache invalidation
├─ Error handling
└─ Concurrent backtests

End-to-End Tests:
├─ Submit backtest → results
├─ Compare strategies → correct ranking
├─ Multiple assets → correlation
└─ UI components → display correctly

Performance Tests:
├─ Backtest speed (2 years data: < 5 seconds)
├─ API response time (< 2 seconds)
├─ Database queries (with indexes < 100ms)
└─ Cache hit rate (> 80%)
```

#### 5.2 Deployment

```bash
# 1. Prepare for production
pip freeze > requirements.txt
Create .env file with production configs
Update database connection to production DB

# 2. Deploy backend (Railway or Render)
git push # Automatic deployment from Git

# 3. Deploy frontend (Vercel or Netlify)
npm run build
git push # Automatic deployment

# 4. Test production
curl https://api.yourapp.com/health
Check frontend loads
Run backtest end-to-end

# 5. Setup monitoring
Configure error tracking (Sentry)
Setup performance monitoring
Create alerts
```

---

## Week-by-Week Breakdown

### If Extending to Full Week (7 Days)

```
Day 1: Setup & Core
├─ Environment setup
├─ Build indicators
├─ Build signals
└─ Build position manager

Day 2: Complete Core
├─ Build metrics
├─ Build backtester
├─ Test all modules
└─ Optimize calculations

Day 3: Data & APIs
├─ Setup database
├─ Build data service
├─ Create API endpoints
└─ Implement caching

Day 4: Services & Integration
├─ Build service layer
├─ Connect API to core
├─ Test end-to-end
└─ Implement error handling

Day 5: Frontend
├─ React setup
├─ Build forms & controls
├─ Build charts
└─ Integrate with API

Day 6: Advanced Features
├─ Strategy comparison
├─ Correlation analysis
├─ Parameter optimization
└─ Add more strategies

Day 7: Polish & Deploy
├─ Testing & bug fixes
├─ Performance optimization
├─ Documentation
├─ Deployment
└─ Demo preparation
```

---

## Core Modules to Build

### Order of Implementation (Priority)

```
Priority 1 (Must Have):
├─ 1. Indicator Calculator
├─ 2. Signal Generator (SMA Crossover)
├─ 3. Position Manager
├─ 4. Metrics Calculator
└─ 5. Backtester

Priority 2 (Essential):
├─ 6. API Endpoints (/backtest, /data, /strategies)
├─ 7. Database Models & Repositories
├─ 8. Services Layer
└─ 9. Data Fetcher

Priority 3 (Great to Have):
├─ 10. Caching (Redis)
├─ 11. Frontend Components
├─ 12. Charts & Visualization
└─ 13. Strategy Comparison

Priority 4 (Nice to Have):
├─ 14. Correlation Analysis
├─ 15. Parameter Optimization
├─ 16. Advanced Strategies
├─ 17. User Authentication
└─ 18. Advanced Error Handling
```

---

## Complete Data Pipeline

### Step-by-Step Execution

```
PHASE 1: REQUEST RECEIVED
┌──────────────────────────────┐
│ User submits form             │
│ ├─ Ticker: BTC-USD            │
│ ├─ Dates: 2023-01-01 to 2024  │
│ ├─ Capital: $10,000           │
│ ├─ Strategy: SMA Crossover    │
│ └─ Parameters: {sma_20, sma_50}│
└──────────────────────────────┘
           │
           ▼
PHASE 2: VALIDATE
┌──────────────────────────────┐
│ API Validation               │
│ ├─ Check dates valid         │
│ ├─ Check capital > 0         │
│ ├─ Check strategy exists     │
│ └─ Check parameters valid    │
└──────────────────────────────┘
           │
           ▼
PHASE 3: DATABASE (Status: pending)
┌──────────────────────────────┐
│ Save request to DB           │
│ ├─ backtest_results table    │
│ ├─ Set status = 'pending'    │
│ └─ Return backtest_id        │
└──────────────────────────────┘
           │
           ▼
PHASE 4: FETCH DATA
┌──────────────────────────────┐
│ Data Service                 │
│ ├─ Check Redis cache         │
│ ├─ If miss: Call yfinance    │
│ ├─ Validate data quality     │
│ ├─ Cache for 24 hours        │
│ └─ Store in price_data table │
└──────────────────────────────┘
           │
           ▼
PHASE 5: NORMALIZE
┌──────────────────────────────┐
│ Handle gaps                  │
│ ├─ Forward fill weekends     │
│ ├─ Remove null values        │
│ ├─ Sort by date              │
│ └─ Validate >= 50 points     │
└──────────────────────────────┘
           │
           ▼
PHASE 6: CALCULATE INDICATORS
┌──────────────────────────────┐
│ Add columns to DataFrame     │
│ ├─ SMA_20 = rolling avg      │
│ ├─ SMA_50 = rolling avg      │
│ ├─ EMA_12, EMA_26            │
│ ├─ Daily returns             │
│ ├─ Volatility                │
│ └─ Other metrics             │
└──────────────────────────────┘
           │
           ▼
PHASE 7: GENERATE SIGNALS
┌──────────────────────────────┐
│ Signal Generator             │
│ ├─ For SMA strategy:         │
│ │  ├─ if SMA20 > SMA50       │
│ │  ├─   and previous SMA20   │
│ │  ├─   < SMA50 → BUY        │
│ │  └─ Similar for SELL       │
│ └─ Add signal column         │
└──────────────────────────────┘
           │
           ▼
PHASE 8: BACKTEST SIMULATION
┌──────────────────────────────┐
│ For each day:                │
│ ├─ Get price & signal        │
│ ├─ If signal==1 & no pos:    │
│ │  ├─ Calc shares (95% rule) │
│ │  ├─ Calc cost (w/ fees)    │
│ │  ├─ Execute BUY            │
│ │  └─ Log trade              │
│ ├─ Else if signal==-1 & pos: │
│ │  ├─ Calc proceeds          │
│ │  ├─ Calc profit            │
│ │  ├─ Execute SELL           │
│ │  └─ Log trade              │
│ ├─ Update portfolio value    │
│ └─ Store in array            │
└──────────────────────────────┘
           │
           ▼
PHASE 9: CALCULATE METRICS
┌──────────────────────────────┐
│ Performance Analysis         │
│ ├─ Total return %            │
│ ├─ Annualized return         │
│ ├─ Volatility                │
│ ├─ Sharpe ratio              │
│ ├─ Max drawdown              │
│ ├─ Win rate                  │
│ ├─ Benchmark (buy & hold)    │
│ └─ Strategy vs Benchmark     │
└──────────────────────────────┘
           │
           ▼
PHASE 10: SAVE RESULTS
┌──────────────────────────────┐
│ Persist to Database          │
│ ├─ Update backtest_results   │
│ ├─ Set status='completed'    │
│ ├─ Insert all trades         │
│ ├─ Store portfolio values    │
│ └─ Set completed_at time     │
└──────────────────────────────┘
           │
           ▼
PHASE 11: RETURN TO USER
┌──────────────────────────────┐
│ Frontend polls status        │
│ ├─ GET /api/v1/backtest/:id  │
│ ├─ Receives complete results │
│ └─ Renders dashboard         │
└──────────────────────────────┘
           │
           ▼
PHASE 12: DISPLAY RESULTS
┌──────────────────────────────┐
│ Dashboard UI                 │
│ ├─ Price chart + indicators  │
│ ├─ Buy/sell signals marked   │
│ ├─ Portfolio value chart     │
│ ├─ Risk metrics table        │
│ ├─ Trade list table          │
│ ├─ Comparison vs benchmark   │
│ └─ Export options (CSV, JSON)│
└──────────────────────────────┘
```

---

## Integration Steps

### 1. Connect All Modules

```
Step 1: Core modules work independently
├─ Indicators ✓
├─ Signals ✓
├─ Position Manager ✓
├─ Metrics ✓
└─ Backtester ✓

Step 2: Backtester combines modules
├─ Call IndicatorCalculator
├─ Call SignalGenerator
├─ Call PositionManager
└─ Call MetricsCalculator ✓

Step 3: Services orchestrate
├─ BacktestService calls Backtester
├─ DataService fetches data
├─ AnalyticsService calculates metrics ✓

Step 4: API calls services
├─ POST /backtest calls BacktestService
├─ GET /data calls DataService
└─ POST /strategies calls multiple services ✓

Step 5: Frontend calls API
├─ Sends request
├─ Polls for results
└─ Displays results ✓
```

### 2. Data Flow Integration

```
Frontend → API → Service → Core Module → Result → DB → Frontend
   Form    Post    Validate  Backtest   Metrics  Save   Display
```

### 3. Error Handling Integration

```
Each layer catches and re-throws with context:

Frontend (try-catch)
    ↓
API (HTTPException)
    ↓
Service (ValueError, Exception)
    ↓
Core (ValueError, Exception)
    ↓
User gets clear error message
```

---

## Testing Strategy

### Unit Test Example

```python
# test_indicators.py
def test_sma_calculation():
    # Simple moving average of [1, 2, 3, 4, 5] with period 3
    # Should be [NaN, NaN, 2, 3, 4]
    
    data = pd.DataFrame({
        'close': [1, 2, 3, 4, 5]
    })
    
    result = IndicatorCalculator.calculate_sma(data, 3)
    
    assert result.iloc[0] is pd.isna(result.iloc[0])
    assert result.iloc[1] is pd.isna(result.iloc[1])
    assert result.iloc[2] == 2.0
    assert result.iloc[3] == 3.0
    assert result.iloc[4] == 4.0

# test_backtest.py
def test_sma_crossover_generates_signals():
    """Verify SMA crossover generates correct signals"""
    
    # Create simple test data
    data = pd.DataFrame({
        'close': [100, 102, 101, 105, 104, 108, 107, 110, 109, 112],
        'date': pd.date_range('2024-01-01', periods=10, freq='D')
    })
    
    # Calculate indicators
    data = IndicatorCalculator.calculate_all_indicators(data, sma_fast=2, sma_slow=4)
    
    # Generate signals
    signals = SignalGenerator.sma_crossover(data)
    
    # Verify first signal happens when SMA2 crosses above SMA4
    assert (signals != 0).any(), "Should have at least one signal"
```

---

## Deployment Checklist

```
Pre-Deployment:
├─ [ ] All tests passing
├─ [ ] Code reviewed
├─ [ ] Database migrations ready
├─ [ ] API documentation complete
├─ [ ] Environment variables configured
├─ [ ] Performance benchmarks OK
├─ [ ] Error handling tested
└─ [ ] Secrets not in code

Deployment:
├─ [ ] Database migration (create tables)
├─ [ ] Deploy backend (set env vars)
├─ [ ] Deploy frontend (set API URL)
├─ [ ] Run health checks
├─ [ ] Test critical paths
├─ [ ] Verify caching works
└─ [ ] Setup monitoring & alerts

Post-Deployment:
├─ [ ] Monitor error rates
├─ [ ] Check performance metrics
├─ [ ] User acceptance testing
├─ [ ] Documentation updated
├─ [ ] Create backup/rollback plan
└─ [ ] Celebrate! 🎉
```

---

## Key Metrics to Track

```
Performance:
├─ Backtest execution time (target: 2-5 seconds for 2 years)
├─ API response time (target: <2 seconds)
├─ Cache hit rate (target: >80%)
└─ Database query time (target: <100ms)

Quality:
├─ Test coverage (target: >80%)
├─ Error rate (target: <0.1%)
├─ Data accuracy (backtest vs benchmark)
└─ Correlation with real strategies

Business:
├─ Number of backtests run
├─ Average return per strategy
├─ User feedback & NPS
└─ System uptime (target: 99%+)
```

