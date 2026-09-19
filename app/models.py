import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, JSON

from app.db import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class BacktestResult(Base):
    """Mirrors the backtest_results table in BACKEND_ARCHITECTURE.md (subset of columns)."""
    __tablename__ = "backtest_results"

    id = Column(String, primary_key=True, default=gen_uuid)
    ticker = Column(String, nullable=False)
    strategy = Column(String, nullable=False)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)
    initial_capital = Column(Float, nullable=False)
    final_value = Column(Float, nullable=True)
    total_return_percent = Column(Float, nullable=True)
    annualized_return_percent = Column(Float, nullable=True)
    sharpe_ratio = Column(Float, nullable=True)
    volatility_percent = Column(Float, nullable=True)
    max_drawdown_percent = Column(Float, nullable=True)
    calmar_ratio = Column(Float, nullable=True)
    total_trades = Column(Integer, nullable=True)
    win_rate_percent = Column(Float, nullable=True)
    benchmark_return_percent = Column(Float, nullable=True)
    strategy_vs_benchmark = Column(Float, nullable=True)
    status = Column(String, default="pending")
    error_message = Column(String, nullable=True)
    parameters = Column(JSON, nullable=False)
    portfolio_values = Column(JSON, nullable=True)
    dates = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class Trade(Base):
    """Mirrors the trades table in BACKEND_ARCHITECTURE.md."""
    __tablename__ = "trades"

    id = Column(String, primary_key=True, default=gen_uuid)
    backtest_id = Column(String, ForeignKey("backtest_results.id"), nullable=False)
    trade_number = Column(Integer, nullable=False)
    type = Column(String, nullable=False)
    date = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    shares = Column(Float, nullable=False)
    profit = Column(Float, nullable=True)


class User(Base):
    """MASTER_PROMPT_FINTECH_PLATFORM.md Sprint 3: JWT/OAuth2 authentication."""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
