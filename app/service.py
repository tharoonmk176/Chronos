from datetime import datetime

import numpy as np
from sqlalchemy.orm import Session

import backtesting_engine as engine
from app.cache import fetch_cached
from app.db import SessionLocal
from app.models import BacktestResult, Trade
from app.schemas import BacktestRequest


def _native(v):
    """backtesting_engine's metrics are numpy scalars (pandas/numpy ops all the way down).
    SQLite silently accepted them; psycopg2 (Postgres) correctly rejects np.float64/np.int64
    as unadaptable types. Convert once, here, rather than scattering casts everywhere."""
    if isinstance(v, np.generic):
        return v.item()
    return v


def _fetch_cached(ticker: str, start_date: str, end_date: str):
    return fetch_cached(ticker, start_date, end_date, engine.DataFetcher.fetch_data)


def create_pending_record(request: BacktestRequest, db: Session) -> BacktestResult:
    """Insert the pending row synchronously (fast — needed before returning a backtest_id
    to the caller); the actual computation runs in a Celery task afterward."""
    record = BacktestResult(
        ticker=request.ticker,
        strategy=request.strategy,
        start_date=request.start_date,
        end_date=request.end_date,
        initial_capital=request.initial_capital,
        status="pending",
        parameters=request.model_dump(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def execute_backtest(backtest_id: str, request: BacktestRequest) -> None:
    """Runs the actual backtest and updates the pending row. Called from the Celery worker
    (its own DB session — a Celery task never shares a request-scoped FastAPI session)."""
    db = SessionLocal()
    try:
        record = db.query(BacktestResult).filter_by(id=backtest_id).first()
        if record is None:
            return

        try:
            engine.validate_request(
                request.ticker, request.start_date, request.end_date,
                request.initial_capital, request.strategy,
                request.transaction_cost, request.sma_fast, request.sma_slow,
            )

            data = _fetch_cached(request.ticker, request.start_date, request.end_date)
            engine.DataFetcher.validate_data(data)
            data = engine.IndicatorCalculator.calculate_all_indicators(
                data, request.sma_fast, request.sma_slow
            )
            results = engine.Backtester(
                data, request.initial_capital, request.transaction_cost, request.strategy
            ).run()

            summary = results["summary"]
            risk = results["risk_metrics"]
            stats = results["trade_statistics"]

            record.final_value = _native(summary["final_portfolio_value"])
            record.total_return_percent = _native(summary["total_return_percent"])
            record.annualized_return_percent = _native(summary["annualized_return_percent"])
            record.benchmark_return_percent = _native(summary["benchmark_return_percent"])
            record.strategy_vs_benchmark = _native(summary["strategy_vs_benchmark"])
            record.sharpe_ratio = _native(risk["sharpe_ratio"])
            record.volatility_percent = _native(risk["volatility_percent"])
            record.max_drawdown_percent = _native(risk["max_drawdown_percent"])
            record.calmar_ratio = _native(risk.get("calmar_ratio"))
            record.total_trades = _native(stats["total_trades"])
            record.win_rate_percent = _native(stats["win_rate_percent"])
            record.portfolio_values = [_native(v) for v in results["portfolio_values"]]
            record.dates = results["dates"]
            record.status = "completed"
            record.completed_at = datetime.utcnow()

            for i, t in enumerate(results["trades"], 1):
                db.add(Trade(
                    backtest_id=record.id,
                    trade_number=i,
                    type=t["type"],
                    date=t["date"],
                    price=_native(t["price"]),
                    shares=_native(t["shares"]),
                    profit=_native(t.get("profit")),
                ))

            db.commit()

        except Exception as e:
            db.rollback()  # a failed commit leaves the session unusable until rolled back
            record.status = "failed"
            record.error_message = str(e)
            db.commit()
            raise
    finally:
        db.close()


def run_and_persist(request: BacktestRequest, db: Session) -> BacktestResult:
    """Synchronous path (used directly by tests and any non-Celery caller): create the
    pending row and run it inline instead of dispatching to a worker."""
    record = create_pending_record(request, db)
    execute_backtest(record.id, request)
    db.refresh(record)
    return record
