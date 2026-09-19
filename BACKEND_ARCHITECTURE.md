# Backend Architecture & System Design

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Service Layer Architecture](#service-layer-architecture)
7. [Data Flow](#data-flow)
8. [Error Handling](#error-handling)
9. [Performance Optimization](#performance-optimization)
10. [Deployment Strategy](#deployment-strategy)

---

## System Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                            │
│  - Dashboard, Charts, Parameter Controls, Results Display        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────▼──────────────────────────────────────┐
│              API GATEWAY / LOAD BALANCER                         │
│  - Route requests, handle CORS, rate limiting                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│         FASTAPI BACKEND (Main Application Server)               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  API LAYER (Route Handlers)                               │ │
│  │  - POST /backtest (run backtest)                          │ │
│  │  - GET /backtest/:id (get results)                        │ │
│  │  - GET /data/:ticker (fetch price data)                   │ │
│  │  - POST /strategies (run multiple strategies)              │ │
│  │  - GET /correlation (multi-asset correlation)             │ │
│  │  - POST /optimize (parameter optimization)                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│  ┌────────────────────────▼────────────────────────────────────┐ │
│  │  SERVICE LAYER (Business Logic)                            │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │ │
│  │  │ BacktestSvc  │ │ DataSvc      │ │ AnalyticsSvc    │   │ │
│  │  │              │ │              │ │                  │   │ │
│  │  │ - run()      │ │ - fetch()    │ │ - correlate()   │   │ │
│  │  │ - validate() │ │ - cache()    │ │ - metrics()     │   │ │
│  │  │ - metrics()  │ │ - normalize()│ │ - indicators()  │   │ │
│  │  └──────────────┘ └──────────────┘ └──────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│  ┌────────────────────────▼────────────────────────────────────┐ │
│  │  CORE MODULES (Logic Implementations)                      │ │
│  │  ┌────────────────┐ ┌────────────────────┐                 │ │
│  │  │ Backtester     │ │ IndicatorCalc      │                 │ │
│  │  │ PositionMgr    │ │ SignalGenerator    │                 │ │
│  │  │ CorrelAnalyzer │ │ MetricsCalculator  │                 │ │
│  │  └────────────────┘ └────────────────────┘                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│  ┌────────────────────────▼────────────────────────────────────┐ │
│  │  DATA ACCESS LAYER                                         │ │
│  │  - Repository Pattern (Database Access)                    │ │
│  │  - Cache Layer (Redis)                                     │ │
│  │  - External API Clients (yfinance, CoinGecko)             │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────┬───────────┬───────────┬──────────────┬───────────┘
               │           │           │              │
     ┌─────────▼─┐ ┌──────▼────┐ ┌──▼────────┐ ┌───▼──────┐
     │ PostgreSQL│ │   Redis   │ │ yfinance  │ │ CoinGecko│
     │ Database  │ │   Cache   │ │   API     │ │   API    │
     └───────────┘ └───────────┘ └───────────┘ └──────────┘
```

---

## Technology Stack

### Backend Framework
```
FastAPI
├─ Async support (handles concurrent requests)
├─ Built-in OpenAPI documentation
├─ Automatic validation (Pydantic)
├─ High performance (ASGI server)
└─ Easy to deploy
```

### Key Libraries
```
Data & Computation:
├─ pandas - Time series data manipulation
├─ numpy - Numerical computations
├─ scikit-learn - Statistical calculations
└─ scipy - Advanced mathematics

External APIs:
├─ yfinance - Stock/commodity data
├─ ccxt - Crypto exchange data
├─ requests - HTTP requests
└─ aiohttp - Async HTTP requests

Database & Caching:
├─ SQLAlchemy - ORM (database abstraction)
├─ psycopg2 - PostgreSQL driver
├─ redis-py - Redis client
└─ alembic - Database migrations

Utilities:
├─ python-dotenv - Environment variables
├─ pydantic - Data validation
├─ celery - Asynchronous task queue (optional)
├─ pytest - Testing framework
└─ logging - Structured logging
```

### Database
```
PostgreSQL
├─ Time-series data storage
├─ ACID compliance
├─ JSON support (for flexible schemas)
├─ Indexing for fast queries
└─ JSONB for results storage

Alternative: SQLite (for hackathon/local development)
```

### Caching
```
Redis
├─ Cache price data (avoid repeated fetches)
├─ Store recent backtest results
├─ Session management
├─ Rate limiting counters
└─ Task queue (optional)
```

---

## Project Structure

```
fintech-backend/
│
├── main.py                          # Entry point, FastAPI app initialization
├── requirements.txt                 # Python dependencies
├── .env.example                     # Environment variables template
├── .gitignore
│
├── app/
│   ├── __init__.py
│   │
│   ├── api/                         # Route handlers & endpoints
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── backtest.py         # POST /backtest, GET /backtest/:id
│   │   │   ├── data.py             # GET /data/:ticker
│   │   │   ├── strategies.py       # GET /strategies, POST /compare-strategies
│   │   │   ├── correlation.py      # GET /correlation
│   │   │   ├── health.py           # GET /health (status check)
│   │   │   └── router.py           # Combine all routes
│   │
│   ├── services/                   # Business logic layer
│   │   ├── __init__.py
│   │   ├── backtest_service.py     # Backtesting logic orchestration
│   │   ├── data_service.py         # Data fetching & caching
│   │   ├── analytics_service.py    # Metrics & correlation calculations
│   │   └── external_api_service.py # Handle external API calls
│   │
│   ├── core/                       # Core computation modules
│   │   ├── __init__.py
│   │   ├── backtester.py           # Main backtesting engine
│   │   ├── indicators.py           # SMA, EMA, volatility, etc.
│   │   ├── signals.py              # Signal generation (4 strategies)
│   │   ├── position_manager.py     # Trade execution & position sizing
│   │   ├── metrics.py              # Sharpe, drawdown, etc.
│   │   ├── correlation.py          # Correlation analysis
│   │   └── validators.py           # Input validation
│   │
│   ├── models/                     # Database models (SQLAlchemy)
│   │   ├── __init__.py
│   │   ├── backtest.py             # BacktestResult model
│   │   ├── trade.py                # Trade model
│   │   ├── price_data.py           # PriceData model
│   │   └── user.py                 # User model (optional)
│   │
│   ├── schemas/                    # Pydantic request/response models
│   │   ├── __init__.py
│   │   ├── backtest.py             # BacktestRequest, BacktestResponse
│   │   ├── data.py                 # DataResponse
│   │   ├── trade.py                # TradeSchema
│   │   └── common.py               # Shared schemas
│   │
│   ├── repositories/               # Data access layer (DAO pattern)
│   │   ├── __init__.py
│   │   ├── base_repository.py      # Abstract base repository
│   │   ├── backtest_repository.py  # CRUD for backtests
│   │   ├── trade_repository.py     # CRUD for trades
│   │   ├── price_repository.py     # CRUD for price data
│   │   └── cache_repository.py     # Redis caching
│   │
│   ├── config/                     # Configuration
│   │   ├── __init__.py
│   │   ├── settings.py             # App settings (DB URL, API keys, etc.)
│   │   └── constants.py            # Constants (max capital, fee limits, etc.)
│   │
│   ├── utils/                      # Utility functions
│   │   ├── __init__.py
│   │   ├── logger.py               # Structured logging
│   │   ├── exceptions.py           # Custom exceptions
│   │   ├── helpers.py              # Helper functions
│   │   └── datetime_utils.py       # Date/time utilities
│   │
│   └── db/                         # Database setup
│       ├── __init__.py
│       ├── database.py             # DB connection & session management
│       └── migrations/             # Alembic migrations (optional)
│
├── tests/                          # Test suite
│   ├── __init__.py
│   ├── conftest.py                 # Test fixtures & setup
│   ├── test_api/
│   │   ├── test_backtest.py
│   │   ├── test_data.py
│   │   └── test_strategies.py
│   ├── test_services/
│   │   ├── test_backtest_service.py
│   │   └── test_data_service.py
│   └── test_core/
│       ├── test_indicators.py
│       ├── test_signals.py
│       └── test_metrics.py
│
├── scripts/                        # Utility scripts
│   ├── seed_data.py               # Populate test data
│   ├── migrate_db.py              # Run migrations
│   └── benchmark.py               # Performance testing
│
└── docker/                         # Docker files
    ├── Dockerfile
    ├── docker-compose.yml
    └── .dockerignore
```

---

## Database Schema

### Tables Overview

```
backtest_results
├── id (UUID, Primary Key)
├── user_id (Foreign Key, nullable for public)
├── ticker (String)
├── strategy (String: 'sma_crossover', 'ema_trend', 'momentum', 'mean_reversion')
├── start_date (Date)
├── end_date (Date)
├── initial_capital (Decimal)
├── final_value (Decimal)
├── total_return (Decimal)
├── total_return_percent (Float)
├── annualized_return (Float)
├── sharpe_ratio (Float)
├── volatility (Float)
├── max_drawdown (Float)
├── total_trades (Integer)
├── winning_trades (Integer)
├── losing_trades (Integer)
├── win_rate (Float)
├── benchmark_return (Float)
├── strategy_vs_benchmark (Float)
├── status (String: 'pending', 'completed', 'failed')
├── error_message (Text, nullable)
├── parameters (JSON: {sma_fast: 20, sma_slow: 50, ...})
├── portfolio_values (JSONB: [{date, value}, ...])
├── created_at (DateTime)
├── updated_at (DateTime)
└── completed_at (DateTime, nullable)

trades
├── id (UUID, Primary Key)
├── backtest_id (Foreign Key → backtest_results)
├── trade_number (Integer)
├── entry_date (Date)
├── entry_price (Decimal)
├── exit_date (Date, nullable)
├── exit_price (Decimal, nullable)
├── shares (Float)
├── entry_cost (Decimal)
├── exit_proceeds (Decimal, nullable)
├── profit_loss (Decimal, nullable)
├── profit_loss_percent (Float, nullable)
├── status (String: 'open', 'closed')
└── created_at (DateTime)

price_data
├── id (UUID, Primary Key)
├── ticker (String)
├── date (Date)
├── open (Decimal)
├── high (Decimal)
├── low (Decimal)
├── close (Decimal)
├── volume (BigInteger)
├── fetched_at (DateTime)
└── source (String: 'yfinance', 'coingecko', 'binance')
[INDEX: ticker, date UNIQUE]

strategy_parameters
├── id (UUID, Primary Key)
├── name (String: 'SMA_20_50', 'EMA_12_26', ...)
├── strategy_type (String)
├── parameters (JSON)
├── description (Text, nullable)
├── is_default (Boolean)
└── created_at (DateTime)

users (optional, for multi-user support)
├── id (UUID, Primary Key)
├── email (String, UNIQUE)
├── password_hash (String)
├── name (String)
├── created_at (DateTime)
└── updated_at (DateTime)
```

### SQL Create Statements

```sql
-- backtest_results table
CREATE TABLE backtest_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ticker VARCHAR(20) NOT NULL,
    strategy VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_capital DECIMAL(15,2) NOT NULL,
    final_value DECIMAL(15,2) NOT NULL,
    total_return DECIMAL(15,2) NOT NULL,
    total_return_percent FLOAT NOT NULL,
    annualized_return FLOAT NOT NULL,
    sharpe_ratio FLOAT NOT NULL,
    volatility FLOAT NOT NULL,
    max_drawdown FLOAT NOT NULL,
    max_drawdown_from_date DATE,
    max_drawdown_to_date DATE,
    total_trades INTEGER NOT NULL DEFAULT 0,
    winning_trades INTEGER NOT NULL DEFAULT 0,
    losing_trades INTEGER NOT NULL DEFAULT 0,
    win_rate FLOAT,
    avg_profit_per_trade DECIMAL(15,2),
    benchmark_return FLOAT NOT NULL,
    strategy_vs_benchmark FLOAT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    parameters JSONB NOT NULL,
    portfolio_values JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    CONSTRAINT check_dates CHECK (start_date < end_date),
    CONSTRAINT check_capital CHECK (initial_capital > 0)
);

-- trades table
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backtest_id UUID NOT NULL REFERENCES backtest_results(id) ON DELETE CASCADE,
    trade_number INTEGER NOT NULL,
    entry_date DATE NOT NULL,
    entry_price DECIMAL(15,8) NOT NULL,
    exit_date DATE,
    exit_price DECIMAL(15,8),
    shares FLOAT NOT NULL,
    entry_cost DECIMAL(15,2) NOT NULL,
    exit_proceeds DECIMAL(15,2),
    profit_loss DECIMAL(15,2),
    profit_loss_percent FLOAT,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_prices CHECK (entry_price > 0 AND (exit_price IS NULL OR exit_price > 0))
);

-- price_data table
CREATE TABLE price_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    open DECIMAL(15,8) NOT NULL,
    high DECIMAL(15,8) NOT NULL,
    low DECIMAL(15,8) NOT NULL,
    close DECIMAL(15,8) NOT NULL,
    volume BIGINT NOT NULL,
    fetched_at TIMESTAMP DEFAULT NOW(),
    source VARCHAR(50),
    
    UNIQUE(ticker, date),
    CONSTRAINT check_hloc CHECK (high >= open AND high >= close AND low <= open AND low <= close)
);

CREATE INDEX idx_price_data_ticker_date ON price_data(ticker, date DESC);
CREATE INDEX idx_backtest_results_ticker_strategy ON backtest_results(ticker, strategy);
CREATE INDEX idx_trades_backtest_id ON trades(backtest_id);
```

---

## API Endpoints

### Authentication (Optional for MVP)
```
POST /auth/register
POST /auth/login
POST /auth/logout
GET /auth/me
```

### Backtest Endpoints

#### 1. Run Backtest
```
POST /api/v1/backtest

Request Body:
{
    "ticker": "BTC-USD",
    "start_date": "2023-01-01",
    "end_date": "2024-01-01",
    "initial_capital": 10000,
    "strategy": "sma_crossover",
    "transaction_cost": 0.001,
    "parameters": {
        "sma_fast": 20,
        "sma_slow": 50
    }
}

Response (202 Accepted):
{
    "backtest_id": "uuid-here",
    "status": "pending",
    "created_at": "2024-01-15T10:00:00Z"
}
```

#### 2. Get Backtest Results
```
GET /api/v1/backtest/{backtest_id}

Response (200 OK):
{
    "backtest_id": "uuid",
    "ticker": "BTC-USD",
    "strategy": "sma_crossover",
    "status": "completed",
    "summary": {
        "initial_capital": 10000,
        "final_value": 12450.50,
        "total_return_percent": 24.5,
        "annualized_return": 11.2,
        "benchmark_return": 8.5,
        "strategy_vs_benchmark": 16.0
    },
    "risk_metrics": {
        "volatility": 0.18,
        "sharpe_ratio": 1.8,
        "max_drawdown": -15.3,
        "max_drawdown_from": "2023-06-15",
        "max_drawdown_to": "2023-07-10"
    },
    "trade_stats": {
        "total_trades": 30,
        "winning_trades": 18,
        "losing_trades": 12,
        "win_rate": 60.0,
        "avg_profit_per_trade": 136.4
    },
    "trades": [
        {
            "trade_number": 1,
            "entry_date": "2023-01-15",
            "entry_price": 41234.50,
            "exit_date": "2023-02-20",
            "exit_price": 42100.00,
            "profit": 865.50,
            "profit_percent": 2.1
        }
    ],
    "portfolio_values": [
        {"date": "2023-01-01", "value": 10000},
        {"date": "2023-01-02", "value": 10050}
    ],
    "created_at": "2024-01-15T10:00:00Z",
    "completed_at": "2024-01-15T10:15:30Z"
}
```

#### 3. List User's Backtests
```
GET /api/v1/backtest?skip=0&limit=10&strategy=sma_crossover&ticker=BTC-USD

Response (200 OK):
{
    "total": 45,
    "skip": 0,
    "limit": 10,
    "results": [
        { backtest object },
        { backtest object }
    ]
}
```

#### 4. Delete Backtest
```
DELETE /api/v1/backtest/{backtest_id}

Response (200 OK):
{
    "message": "Backtest deleted successfully"
}
```

---

### Data Endpoints

#### 5. Fetch Price Data
```
GET /api/v1/data/{ticker}?start_date=2023-01-01&end_date=2024-01-01

Response (200 OK):
{
    "ticker": "BTC-USD",
    "start_date": "2023-01-01",
    "end_date": "2024-01-01",
    "data_points": 365,
    "data": [
        {
            "date": "2023-01-01",
            "open": 41234.50,
            "high": 42000.00,
            "low": 41000.00,
            "close": 41800.00,
            "volume": 1000000000
        }
    ]
}
```

#### 6. List Available Tickers
```
GET /api/v1/data/tickers

Response (200 OK):
{
    "tickers": [
        {"symbol": "BTC-USD", "name": "Bitcoin", "type": "crypto"},
        {"symbol": "GLD", "name": "Gold ETF", "type": "commodity"},
        {"symbol": "NVDA", "name": "NVIDIA", "type": "stock"}
    ]
}
```

---

### Strategy Endpoints

#### 7. Get Available Strategies
```
GET /api/v1/strategies

Response (200 OK):
{
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
        {
            "id": "ema_trend",
            "name": "EMA Trend",
            ...
        }
    ]
}
```

#### 8. Compare Multiple Strategies
```
POST /api/v1/strategies/compare

Request Body:
{
    "ticker": "BTC-USD",
    "start_date": "2023-01-01",
    "end_date": "2024-01-01",
    "initial_capital": 10000,
    "strategies": ["sma_crossover", "ema_trend", "momentum", "mean_reversion"]
}

Response (200 OK):
{
    "ticker": "BTC-USD",
    "comparison": [
        {
            "strategy": "sma_crossover",
            "total_return_percent": 24.5,
            "sharpe_ratio": 1.8,
            "max_drawdown": -15.3,
            "win_rate": 60.0
        },
        {
            "strategy": "ema_trend",
            "total_return_percent": 28.3,
            "sharpe_ratio": 1.9,
            "max_drawdown": -12.5,
            "win_rate": 62.0
        }
    ]
}
```

---

### Correlation Endpoints

#### 9. Get Correlation Matrix
```
GET /api/v1/correlation?tickers=BTC-USD,GLD,NVDA&start_date=2023-01-01&end_date=2024-01-01

Response (200 OK):
{
    "tickers": ["BTC-USD", "GLD", "NVDA"],
    "start_date": "2023-01-01",
    "end_date": "2024-01-01",
    "correlation_matrix": {
        "BTC-USD": {"BTC-USD": 1.0, "GLD": 0.30, "NVDA": 0.45},
        "GLD": {"BTC-USD": 0.30, "GLD": 1.0, "NVDA": 0.10},
        "NVDA": {"BTC-USD": 0.45, "GLD": 0.10, "NVDA": 1.0}
    },
    "interpretation": {
        "BTC-USD vs GLD": "Moderately Positive (0.30)",
        "BTC-USD vs NVDA": "Moderately Positive (0.45)",
        "GLD vs NVDA": "Low Correlation (0.10)"
    }
}
```

---

### Health & System Endpoints

#### 10. Health Check
```
GET /api/v1/health

Response (200 OK):
{
    "status": "healthy",
    "timestamp": "2024-01-15T10:00:00Z",
    "services": {
        "database": "connected",
        "cache": "connected",
        "external_apis": "ok"
    }
}
```

#### 11. API Stats
```
GET /api/v1/stats

Response (200 OK):
{
    "total_backtests": 1250,
    "completed_today": 45,
    "avg_execution_time_seconds": 2.5,
    "cache_hit_rate": 0.85,
    "api_version": "v1"
}
```

---

## Service Layer Architecture

### BacktestService
```python
class BacktestService:
    """Orchestrates backtesting workflow"""
    
    def validate_request(request: BacktestRequest) -> bool
        # Validate dates, capital, parameters
    
    def fetch_and_prepare_data(ticker, dates) -> DataFrame
        # Fetch data, handle gaps, normalize
    
    def calculate_indicators(data, strategy_params) -> DataFrame
        # Calculate SMA, EMA, returns, etc.
    
    def run_backtest(data, strategy, params) -> BacktestResult
        # Execute backtesting logic
    
    def save_results(result) -> UUID
        # Store in database
    
    def execute(request: BacktestRequest) -> BacktestResult
        # Main orchestration method
```

### DataService
```python
class DataService:
    """Manages data fetching and caching"""
    
    def fetch_from_external_api(ticker, start, end) -> DataFrame
        # Call yfinance or CoinGecko
    
    def get_from_cache(ticker, start, end) -> DataFrame or None
        # Try Redis first
    
    def store_in_cache(ticker, data) -> void
        # Cache for 24 hours
    
    def fetch_data(ticker, start, end) -> DataFrame
        # Check cache → fetch → cache
    
    def validate_data_quality(data) -> bool
        # Check for gaps, null values
```

### AnalyticsService
```python
class AnalyticsService:
    """Calculates metrics and analytics"""
    
    def calculate_indicators(data, sma_fast, sma_slow) -> DataFrame
        # SMA, EMA, returns
    
    def calculate_risk_metrics(returns, portfolio_values) -> RiskMetrics
        # Sharpe, volatility, drawdown
    
    def calculate_correlation(assets: Dict[str, DataFrame]) -> CorrelationMatrix
        # Correlation between assets
    
    def analyze_trades(trades: List[Trade]) -> TradeStats
        # Win rate, avg profit, etc.
```

---

## Data Flow

### Complete Backtest Execution Flow

```
1. USER SUBMITS REQUEST
   ├─ POST /api/v1/backtest
   └─ Payload: {ticker, dates, capital, strategy, params}

2. API VALIDATION
   ├─ Validate input (dates, capital > 0, strategy exists)
   ├─ Check for duplicate recent requests (prevent spam)
   └─ Generate backtest_id (UUID)

3. SAVE TO DATABASE (Status: "pending")
   ├─ backtest_results table
   └─ Return backtest_id to user (202 Accepted)

4. FETCH PRICE DATA
   ├─ Check Redis cache first
   ├─ If not cached: Call yfinance/CoinGecko API
   ├─ Store in price_data table
   ├─ Cache in Redis for 24 hours
   └─ Return DataFrame with OHLCV

5. DATA VALIDATION & NORMALIZATION
   ├─ Check for null values
   ├─ Handle missing days (weekends, holidays)
   ├─ Verify at least 50 data points
   └─ Sort by date ascending

6. CALCULATE INDICATORS
   ├─ SMA (fast & slow)
   ├─ EMA (fast & slow)
   ├─ Daily returns
   ├─ Volatility
   └─ Return DataFrame with new columns

7. GENERATE SIGNALS
   ├─ Based on strategy type:
   │  ├─ SMA Crossover: fast MA crosses slow MA
   │  ├─ EMA Trend: EMA_fast > EMA_slow crossover
   │  ├─ Momentum: Price momentum turns positive/negative
   │  └─ Mean Reversion: Price vs Bollinger Bands
   └─ Return signal series (1, 0, -1)

8. BACKTEST SIMULATION
   ├─ Initialize: cash=initial_capital, position=0, trades=[]
   ├─ For each day in history:
   │  ├─ Get price, signal
   │  ├─ If signal==1 (BUY) and position==0:
   │  │  ├─ Calculate shares (95% of capital / price)
   │  │  ├─ Calculate cost (shares × price × (1 + fee))
   │  │  ├─ Update: cash -= cost, position = shares
   │  │  └─ Record trade (BUY)
   │  ├─ Else if signal==-1 (SELL) and position>0:
   │  │  ├─ Calculate proceeds (shares × price × (1 - fee))
   │  │  ├─ Calculate profit = proceeds - cost
   │  │  ├─ Update: cash += proceeds, position = 0
   │  │  └─ Record trade (SELL)
   │  ├─ Calculate portfolio_value = cash + (position × price)
   │  └─ Store portfolio_value for this day
   └─ Return trades list, portfolio values over time

9. CALCULATE PERFORMANCE METRICS
   ├─ Returns:
   │  ├─ Total Return = (Final Value - Initial Capital) / Initial Capital
   │  └─ Annualized Return = ((Final/Initial) ^ (1/years)) - 1
   ├─ Risk Metrics:
   │  ├─ Volatility = Std Dev of daily returns × √252
   │  ├─ Sharpe Ratio = (Avg Return - Risk Free Rate) / Volatility
   │  └─ Max Drawdown = Worst peak-to-trough decline
   ├─ Trade Stats:
   │  ├─ Win Rate = (Winning Trades / Total Trades) × 100
   │  ├─ Avg Profit = Total Profit / Total Trades
   │  └─ Other metrics
   ├─ Benchmark (Buy & Hold):
   │  └─ Return = (Last Price - First Price) / First Price
   └─ Comparison = Strategy Return - Benchmark Return

10. SAVE RESULTS TO DATABASE
    ├─ Update backtest_results (status: "completed")
    ├─ Insert trades into trades table
    ├─ Store portfolio_values as JSONB
    ├─ Calculate completed_at timestamp
    └─ Status code: 200

11. RETURN RESULTS TO USER
    ├─ GET /api/v1/backtest/{backtest_id}
    └─ Return all metrics, trades, charts data

12. USER VIEWS RESULTS
    ├─ Dashboard displays:
    │  ├─ Price chart with SMAs
    │  ├─ Buy/Sell signals marked
    │  ├─ Portfolio value over time
    │  ├─ Strategy vs Benchmark comparison
    │  ├─ Risk metrics (Sharpe, Drawdown)
    │  └─ Trade list
    └─ Can download results as CSV/JSON
```

---

## Error Handling

### Error Response Format
```json
{
    "detail": "String description of error",
    "error_code": "SPECIFIC_ERROR_CODE",
    "timestamp": "2024-01-15T10:00:00Z",
    "request_id": "uuid-for-tracking"
}
```

### Error Codes & Status Codes

| Status | Code | Reason |
|--------|------|--------|
| 400 | INVALID_DATES | start_date >= end_date |
| 400 | INVALID_CAPITAL | capital <= 0 |
| 400 | INVALID_STRATEGY | strategy doesn't exist |
| 400 | INSUFFICIENT_DATA | < 50 data points available |
| 404 | BACKTEST_NOT_FOUND | backtest_id doesn't exist |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | DATA_FETCH_FAILED | yfinance/CoinGecko error |
| 500 | BACKTEST_ERROR | Error during simulation |
| 503 | SERVICE_UNAVAILABLE | Database or cache down |

### Error Handling Strategy

```python
# API Layer
try:
    validate_request(request)
    result = service.execute(request)
    return result
except ValidationError as e:
    return {"detail": str(e), "status": 400}
except ExternalAPIError as e:
    log_error(e)
    return {"detail": "Failed to fetch data", "status": 503}
except Exception as e:
    log_critical_error(e)
    return {"detail": "Internal server error", "status": 500}
```

---

## Performance Optimization

### 1. Caching Strategy
```
Redis Cache Layers:
├─ Price Data: Cache 24 hours (key: ticker:date_range)
├─ Backtest Results: Cache 1 hour (key: backtest_id)
├─ Strategy Metadata: Cache 7 days (key: strategy_list)
└─ Correlation Results: Cache 6 hours (key: correlation:tickers)
```

### 2. Database Optimization
```
Indexes:
├─ price_data (ticker, date) - Fast price lookups
├─ backtest_results (user_id, created_at) - Fast user backtest list
├─ trades (backtest_id) - Fast trade lookups by backtest
└─ price_data (ticker, date) UNIQUE - Prevent duplicates

Partitioning (optional for large datasets):
└─ Partition price_data by ticker for faster queries
```

### 3. Asynchronous Processing (Optional)
```
Celery Tasks (for long-running backtests):
├─ Long backtests (>10 years data) run as background tasks
├─ User gets backtest_id immediately
├─ UI polls /api/v1/backtest/{id} for progress
├─ Celery sends completion notification (WebSocket)
└─ Results available when ready
```

### 4. Batch Operations
```
Avoid:
├─ Individual API calls per day
└─ Row-by-row database inserts

Do:
├─ Fetch all data at once (yfinance supports date ranges)
└─ Bulk insert trades (executemany, batch sizes of 1000)
```

### 5. Algorithm Optimization
```
Data Structure:
├─ Use NumPy arrays for calculations (faster than Python loops)
├─ Use Pandas for time-series operations
└─ Avoid repeated calculations (cache indicator values)

Computation:
├─ Pre-calculate moving averages once
├─ Use vectorized operations (pandas .rolling, .shift)
└─ Avoid nested loops (use NumPy broadcasting)
```

---

## Deployment Strategy

### Development (Local)
```bash
# Setup
pip install -r requirements.txt
python -m uvicorn main:app --reload

# Database
sqlite:///backtest.db (simple, no setup)
```

### Staging
```
Backend: Cloud provider (Railway, Render, Heroku)
├─ 1 instance, 1GB RAM
├─ PostgreSQL (shared)
└─ Redis (shared)

Frontend: Vercel or Netlify
```

### Production
```
Architecture:
├─ Load Balancer (nginx or cloud provider)
├─ 2+ FastAPI instances (auto-scaling)
├─ PostgreSQL (managed, replicated)
├─ Redis (managed)
├─ S3 (optional, for result storage)
└─ CDN (Cloudflare, for static files)

Monitoring:
├─ Error tracking (Sentry)
├─ Performance monitoring (New Relic, Datadog)
├─ Uptime monitoring
└─ Alerts for failures
```

### Docker Deployment
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Security Considerations

1. **Input Validation** - All inputs validated with Pydantic
2. **Rate Limiting** - Prevent abuse (Redis-based)
3. **CORS** - Restrict frontend origin
4. **HTTPS** - All production traffic encrypted
5. **API Keys** - External APIs protected in env vars
6. **SQL Injection** - SQLAlchemy ORM prevents this
7. **Database Credentials** - Stored in env vars, never in code
8. **Error Messages** - Don't expose internal details in responses

