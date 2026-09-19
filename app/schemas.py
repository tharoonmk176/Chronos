from typing import Dict, List

from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: str


class BacktestRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str
    initial_capital: float = 10000
    strategy: str = "sma_crossover"
    transaction_cost: float = 0.001
    sma_fast: int = 20
    sma_slow: int = 50


class CompareStrategiesRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str
    initial_capital: float = 10000
    strategies: List[str] = ["sma_crossover", "ema_trend", "momentum", "mean_reversion"]


class CorrelationRequest(BaseModel):
    tickers: List[str]
    start_date: str
    end_date: str


class OptimizationRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str
    strategy: str = "sma_crossover"
    initial_capital: float = 10000
    param_ranges: Dict[str, List[int]]


class RollingCorrelationRequest(BaseModel):
    ticker1: str
    ticker2: str
    start_date: str
    end_date: str
    window: int = 30


class RegimeRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str
    strategy: str = "sma_crossover"
    initial_capital: float = 10000
    transaction_cost: float = 0.001
    sma_fast: int = 20
    sma_slow: int = 50
