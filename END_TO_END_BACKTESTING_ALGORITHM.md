# Complete End-to-End Backtesting Algorithm
## Comprehensive Logic Flow, Pseudocode & Examples

---

## Table of Contents
1. [Algorithm Overview](#algorithm-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Detailed 12-Phase Pipeline](#detailed-12-phase-pipeline)
4. [Complete Pseudocode](#complete-pseudocode)
5. [Data Structures](#data-structures)
6. [State Management](#state-management)
7. [Error Handling Strategy](#error-handling-strategy)
8. [Real-World Examples](#real-world-examples)
9. [Performance Metrics Calculation](#performance-metrics-calculation)
10. [Advanced Considerations](#advanced-considerations)

---

## Algorithm Overview

### Core Principle
The backtesting algorithm simulates a trading strategy on historical data to evaluate:
- **Profitability**: Does the strategy make money?
- **Risk**: How volatile is the portfolio?
- **Risk-Adjusted Returns**: Is the strategy good considering the risk taken?

### Key Constraints
- **No Look-Ahead Bias**: Only use data available up to current time
- **Realistic Costs**: Include transaction costs (0.1% per trade)
- **Position Sizing**: Risk management (use 95% of capital per trade)
- **Benchmark Comparison**: Compare against Buy & Hold strategy

---

## High-Level Architecture

```
INPUT
  ↓
[Fetch Data] → Validate
  ↓
[Calculate Indicators] → SMA, EMA, Returns, Volatility
  ↓
[Generate Signals] → Buy/Sell/Hold decisions
  ↓
[Execute Trades] → Simulate portfolio transactions
  ↓
[Calculate Metrics] → Sharpe, Drawdown, Win Rate
  ↓
OUTPUT ← Database/Display
```

### Detailed Flow Diagram

```
1. USER SUBMITS REQUEST
   ticker: 'BTC-USD'
   start_date: '2023-01-01'
   end_date: '2024-01-01'
   strategy: 'sma_crossover'
   initial_capital: $10,000
                ↓
2. VALIDATE REQUEST
   ✓ Dates are valid (start < end)
   ✓ Capital > 0
   ✓ Strategy exists
                ↓
3. FETCH HISTORICAL DATA
   Download OHLCV data from yfinance
   Normalize column names
   Sort by date ascending
   Result: DataFrame with 252 trading days
                ↓
4. VALIDATE DATA
   ✓ Has required columns (OHLCV)
   ✓ Has minimum 50 data points
   ✓ No null values
   ✓ Dates are unique and sorted
                ↓
5. CALCULATE TECHNICAL INDICATORS
   For each day:
   ├─ SMA_20 = average of last 20 closes
   ├─ SMA_50 = average of last 50 closes
   ├─ EMA_12 = exponential average (12 period)
   ├─ EMA_26 = exponential average (26 period)
   ├─ Daily Returns = % change from previous close
   ├─ Volatility = std dev of returns × √252
   └─ Cumulative Returns = compound returns over time
                ↓
6. GENERATE ENTRY/EXIT SIGNALS
   Strategy: SMA Crossover
   ├─ BUY when: SMA_20 crosses above SMA_50
   ├─ SELL when: SMA_20 crosses below SMA_50
   ├─ Result: signal = [1, 0, -1] for each day
   └─ Verify: No look-ahead (only use past data)
                ↓
7. INITIALIZE PORTFOLIO STATE
   cash = $10,000 (100% available)
   position_size = 0 (no shares held)
   entry_price = None
   entry_cost = None
   trades = [] (record all trades)
   portfolio_values = [] (track portfolio over time)
                ↓
8. SIMULATE TRADING FOR EACH DAY
   For day t = 0 to end:
   
   a) Get Today's Price
      price = data['close'].iloc[t]
   
   b) Get Today's Signal
      signal = signals.iloc[t]
   
   c) If BUY Signal & No Position:
      │
      ├─ shares = (cash × 0.95) / price
      ├─ cost = shares × price × (1 + 0.001 fee)
      │
      ├─ If cost > cash:
      │  └─ SKIP (insufficient funds)
      │
      ├─ cash -= cost
      ├─ position_size = shares
      ├─ entry_price = price
      ├─ entry_cost = cost
      │
      └─ Log Trade:
         {
           'type': 'BUY',
           'date': date,
           'price': price,
           'shares': shares,
           'cost': cost
         }
   
   d) Else If SELL Signal & Have Position:
      │
      ├─ proceeds = position_size × price × (1 - 0.001 fee)
      ├─ profit = proceeds - entry_cost
      ├─ cash += proceeds
      │
      ├─ Log Trade:
         {
           'type': 'SELL',
           'date': date,
           'price': price,
           'proceeds': proceeds,
           'profit': profit,
           'profit_pct': (profit / entry_cost) × 100
         }
      │
      └─ position_size = 0
   
   e) Calculate Daily Portfolio Value:
      portfolio_value = cash + (position_size × price)
      portfolio_values.append(portfolio_value)
                ↓
9. CALCULATE PERFORMANCE METRICS
   
   Returns:
   ├─ final_value = portfolio_values[-1]
   ├─ total_profit = final_value - initial_capital
   ├─ total_return_pct = (total_profit / initial_capital) × 100
   └─ annualized_return = ((final/initial) ^ (1/years)) - 1
   
   Risk:
   ├─ daily_volatility = std_dev(portfolio_returns)
   ├─ annual_volatility = daily_volatility × √252
   └─ max_drawdown = (trough - peak) / peak
   
   Risk-Adjusted:
   ├─ excess_return = annual_return - risk_free_rate
   └─ sharpe_ratio = excess_return / annual_volatility
   
   Trade Analysis:
   ├─ total_trades = len(trades) / 2  # pairs of buy/sell
   ├─ winning_trades = count(profit > 0)
   ├─ losing_trades = count(profit < 0)
   ├─ win_rate = (winning / total) × 100
   └─ avg_profit_per_trade = total_profit / total_trades
   
   Benchmark (Buy & Hold):
   ├─ buy_hold_shares = initial_capital / first_price
   ├─ buy_hold_final = buy_hold_shares × last_price
   ├─ benchmark_return = (buy_hold_final - initial) / initial
   └─ outperformance = strategy_return - benchmark_return
                ↓
10. PREPARE RESULTS PACKAGE
    {
      'summary': {
        'initial_capital': 10000,
        'final_value': 12500,
        'total_profit': 2500,
        'total_return_pct': 25.0,
        'benchmark_return_pct': 15.0,
        'strategy_vs_benchmark': 10.0
      },
      'risk_metrics': {
        'volatility_pct': 28.5,
        'sharpe_ratio': 0.87,
        'max_drawdown_pct': -18.2,
        'max_drawdown_peak_date': '2023-06-15',
        'max_drawdown_trough_date': '2023-08-20'
      },
      'trade_statistics': {
        'total_trades': 12,
        'winning_trades': 8,
        'losing_trades': 4,
        'win_rate_pct': 66.67,
        'avg_profit_per_trade': 208.33,
        'best_trade_profit': 1200,
        'worst_trade_loss': -450
      },
      'trades': [
        {
          'entry_date': '2023-01-15',
          'entry_price': 25000,
          'exit_date': '2023-02-20',
          'exit_price': 27500,
          'shares': 0.38,
          'entry_cost': 9500,
          'exit_proceeds': 10412.50,
          'profit': 912.50,
          'profit_pct': 9.6
        },
        ...
      ],
      'portfolio_values': [10000, 10050, 10100, ..., 12500],
      'portfolio_dates': ['2023-01-01', '2023-01-02', ...]
    }
                ↓
11. SAVE TO DATABASE
    Insert into backtest_results table:
    - backtest_id
    - ticker, strategy, dates
    - summary metrics
    - all trades
    - portfolio values (JSONB)
    - timestamp
                ↓
12. RETURN TO USER
    Send API response with:
    - Status: 'completed'
    - Summary metrics
    - Charts data (portfolio value, buy/sell signals)
    - Trade list
    - Risk analysis
```

---

## Detailed 12-Phase Pipeline

### PHASE 1: REQUEST VALIDATION

**Pseudocode:**
```
Function ValidateRequest(request):
    
    1. Check Dates
       if start_date >= end_date:
           throw InvalidDatesError
    
    2. Check Capital
       if initial_capital <= 0:
           throw InvalidCapitalError
    
    3. Check Strategy
       if strategy not in ['sma_crossover', 'ema_trend', 'momentum', 'mean_reversion']:
           throw InvalidStrategyError
    
    4. Check Parameters
       if sma_fast >= sma_slow:
           throw InvalidParametersError("sma_fast must be < sma_slow")
    
    5. Check Transaction Cost
       if transaction_cost < 0 or transaction_cost > 0.1:
           throw InvalidTransactionCostError
    
    Return: True if all checks pass
```

**Python Implementation:**
```python
def validate_request(request: BacktestRequest) -> bool:
    errors = []
    
    # Date validation
    start = datetime.strptime(request.start_date, '%Y-%m-%d')
    end = datetime.strptime(request.end_date, '%Y-%m-%d')
    if start >= end:
        errors.append("start_date must be before end_date")
    
    # Capital validation
    if request.initial_capital <= 0:
        errors.append("initial_capital must be > 0")
    
    # Strategy validation
    valid_strategies = ['sma_crossover', 'ema_trend', 'momentum', 'mean_reversion']
    if request.strategy not in valid_strategies:
        errors.append(f"strategy must be one of {valid_strategies}")
    
    # Parameter validation
    if request.sma_fast >= request.sma_slow:
        errors.append("sma_fast must be < sma_slow")
    
    if errors:
        raise ValueError("; ".join(errors))
    
    return True
```

---

### PHASE 2: DATA FETCHING & NORMALIZATION

**Pseudocode:**
```
Function FetchData(ticker, start_date, end_date):
    
    1. Call External API
       raw_data = yfinance.download(ticker, start_date, end_date)
    
    2. Check for errors
       if raw_data is empty:
           throw DataNotAvailableError
    
    3. Normalize columns
       data['date'] = raw_data.index
       data['open'] = raw_data['Open']
       data['high'] = raw_data['High']
       data['low'] = raw_data['Low']
       data['close'] = raw_data['Close']
       data['volume'] = raw_data['Volume']
    
    4. Sort and reset index
       data = data.sort_values('date').reset_index(drop=True)
    
    5. Handle gaps (forward fill for weekends/holidays)
       data['close'] = data['close'].fillna(method='ffill')
    
    6. Final validation
       if len(data) < 50:
           throw InsufficientDataError
       
       if data['close'].isnull().any():
           throw DataQualityError
    
    Return: DataFrame with validated OHLCV data
```

**Data Structure After Fetching:**
```
        date       open       high        low      close     volume
0   2023-01-01   41234.50   42000.00   41000.00   41800.00   1234567
1   2023-01-02   41900.00   42500.00   41500.00   42200.00   1345678
2   2023-01-03   42100.00   42300.00   41800.00   42000.00   1456789
...
251 2024-01-01   40500.00   41200.00   40300.00   40800.00   987654
```

---

### PHASE 3: INDICATOR CALCULATION

**Pseudocode for SMA:**
```
Function CalculateSMA(close_prices, period):
    
    sma = []
    
    For i = 0 to len(close_prices):
        if i < period:
            sma[i] = NaN  # Not enough data
        else:
            sum = 0
            for j = (i - period + 1) to i:
                sum += close_prices[j]
            sma[i] = sum / period
    
    Return: sma
```

**Vectorized Python:**
```python
def calculate_sma(closes: pd.Series, period: int) -> pd.Series:
    return closes.rolling(window=period).mean()

# Example
close_prices = [100, 102, 101, 105, 104, 108, 107, 110, 109, 112]
sma_3 = calculate_sma(pd.Series(close_prices), 3)
# Result: [NaN, NaN, 101.0, 102.67, 103.33, 105.67, 106.33, 108.33, 108.67, 110.33]
```

**Pseudocode for EMA:**
```
Function CalculateEMA(close_prices, period):
    
    multiplier = 2 / (period + 1)
    ema = [NaN] × len(close_prices)
    
    # First EMA = SMA
    ema[period - 1] = mean(close_prices[0:period])
    
    For i = period to len(close_prices):
        ema[i] = (close_prices[i] × multiplier) + 
                 (ema[i-1] × (1 - multiplier))
    
    Return: ema
```

**All Indicators Combined:**
```
        date      close  sma_20  sma_50   ema_12   ema_26   returns  volatility
0   2023-01-01  41800.0     NaN     NaN      NaN      NaN        NaN        NaN
1   2023-01-02  42200.0     NaN     NaN      NaN      NaN     0.0096       NaN
...
49  2023-02-20  43500.0  41980.0     NaN    42150.0    NaN     0.0045     0.0185
50  2023-02-21  43800.0  42050.0  41500.0  42300.0    NaN     0.0069     0.0187
...
250 2023-12-31  40800.0  40950.0  40600.0  40750.0  40650.0  -0.0045     0.0285
```

---

### PHASE 4: SIGNAL GENERATION

**Pseudocode for SMA Crossover:**
```
Function GenerateSMA_CrossoverSignals(data):
    
    signals = [0] × len(data)
    
    For i = 1 to len(data):
        
        # Check if we have valid SMAs
        if data['sma_fast'][i] is NaN or data['sma_slow'][i] is NaN:
            signals[i] = 0
            continue
        
        # Golden Cross: fast SMA crosses above slow SMA
        if data['sma_fast'][i-1] <= data['sma_slow'][i-1] AND
           data['sma_fast'][i] > data['sma_slow'][i]:
            signals[i] = 1  # BUY
        
        # Death Cross: fast SMA crosses below slow SMA
        else if data['sma_fast'][i-1] >= data['sma_slow'][i-1] AND
                data['sma_fast'][i] < data['sma_slow'][i]:
            signals[i] = -1  # SELL
        
        else:
            signals[i] = 0  # HOLD
    
    Return: signals
```

**Example Walk-Through:**
```
Day  Close    SMA20    SMA50    Signal   Explanation
---  -----    -----    -----    ------   -----------
48   43200    41950    41450    0        Both NaN or no crossover
49   43500    41980    41500    0        Fast < Slow, not near crossover
50   43800    42050    41600    1        Golden Cross! 42050 > 41600 (prev: 41980 < 41500)
                                        → BUY Signal
51   43500    42000    41650    0        Hold
52   43000    41900    41700    -1       Death Cross! 41900 < 41700 (prev: 42000 > 41650)
                                        → SELL Signal
```

---

### PHASE 5: TRADE EXECUTION SIMULATION

**Core Position Manager Pseudocode:**
```
Class PositionManager:
    
    Attributes:
        cash = initial_capital
        position_size = 0  # shares held
        entry_price = None
        entry_cost = None
        transaction_cost_rate = 0.001  # 0.1%
        trades = []
    
    Function ExecuteBUY(date, price, shares_calculated):
        
        1. Calculate cost with fees
           cost = shares_calculated × price × (1 + transaction_cost_rate)
        
        2. Check if enough cash
           if cost > cash:
               return False  # Cannot execute
        
        3. Execute transaction
           cash -= cost
           position_size = shares_calculated
           entry_price = price
           entry_cost = cost
        
        4. Log trade
           trades.append({
               'date': date,
               'type': 'BUY',
               'price': price,
               'shares': shares_calculated,
               'cost': cost
           })
        
        Return: True (success)
    
    Function ExecuteSELL(date, price):
        
        1. Calculate proceeds with fees
           proceeds = position_size × price × (1 - transaction_cost_rate)
        
        2. Calculate profit
           profit = proceeds - entry_cost
           profit_pct = (profit / entry_cost) × 100
        
        3. Update cash
           cash += proceeds
        
        4. Log trade
           trades.append({
               'date': date,
               'type': 'SELL',
               'price': price,
               'proceeds': proceeds,
               'profit': profit,
               'profit_pct': profit_pct
           })
        
        5. Clear position
           position_size = 0
        
        Return: True (success)
    
    Function GetPortfolioValue(current_price):
        return cash + (position_size × current_price)
```

**Complete Backtesting Loop Pseudocode:**
```
Function RunBacktest(data, initial_capital, transaction_cost, strategy):
    
    1. Initialize
       pm = PositionManager(initial_capital)
       portfolio_values = []
       
    2. Calculate indicators
       data = CalculateIndicators(data)
    
    3. Generate signals
       signals = GenerateSignals(data, strategy)
    
    4. Main simulation loop
       For day = 0 to len(data):
           
           price = data['close'][day]
           signal = signals[day]
           
           # BUY signal: signal == 1
           if signal == 1 AND pm.position_size == 0:
               shares = (pm.cash × 0.95) / price
               success = pm.ExecuteBUY(day, price, shares)
               if not success:
                   log("Insufficient cash for BUY")
           
           # SELL signal: signal == -1
           else if signal == -1 AND pm.position_size > 0:
               success = pm.ExecuteSELL(day, price)
               if not success:
                   log("No position to SELL")
           
           # Record portfolio value (whether we traded or not)
           portfolio_value = pm.GetPortfolioValue(price)
           portfolio_values.append(portfolio_value)
    
    5. Calculate metrics
       metrics = CalculateMetrics(
           portfolio_values,
           pm.trades,
           data['close']
       )
    
    6. Return results
       return {
           'summary': metrics['summary'],
           'risk_metrics': metrics['risk'],
           'trade_statistics': metrics['trades'],
           'trades': pm.trades,
           'portfolio_values': portfolio_values
       }
```

**Example Trade Sequence:**
```
Day  Close    Signal  Action                          Cash       Shares  Portfolio Value
---  -----    ------  ------                          ----       ------  ----------------
0    41800    0       HOLD                           $10,000     0       $10,000
...
50   43800    1       BUY: shares = (10000*0.95)/43800  = 0.217
                      cost = 0.217 × 43800 × 1.001 = $9,522    0.217   $9,522 + $9,484 = $19,006
                      
51   43500    0       HOLD                            $9,522     0.217   $9,522 + $9,440 = $18,962
52   43000    -1      SELL: proceeds = 0.217×43000×0.999 = $9,312
                      profit = 9,312 - 9,522 = -$210  $18,834   0       $18,834
```

---

### PHASE 6: PERFORMANCE METRICS CALCULATION

**Pseudocode for Metrics:**
```
Function CalculateMetrics(portfolio_values, trades, prices):
    
    1. Basic Returns
       initial = portfolio_values[0]
       final = portfolio_values[-1]
       total_profit = final - initial
       total_return_pct = (total_profit / initial) × 100
       years = len(portfolio_values) / 252
       annualized_return = (final / initial) ^ (1/years) - 1
    
    2. Volatility
       daily_returns = [portfolio_values[i] / portfolio_values[i-1] - 1 
                        for i in range(1, len(portfolio_values))]
       volatility_daily = stdev(daily_returns)
       volatility_annual = volatility_daily × √252
    
    3. Max Drawdown
       running_max = 0
       max_dd = 0
       peak_idx = 0
       trough_idx = 0
       
       For i = 0 to len(portfolio_values):
           if portfolio_values[i] > running_max:
               running_max = portfolio_values[i]
               peak_idx = i
           
           drawdown = (portfolio_values[i] - running_max) / running_max
           
           if drawdown < max_dd:
               max_dd = drawdown
               trough_idx = i
       
       max_dd_pct = max_dd × 100
    
    4. Sharpe Ratio
       excess_return = annualized_return - risk_free_rate (0.02)
       sharpe = excess_return / volatility_annual
    
    5. Trade Statistics
       winning_trades = count(trades where profit > 0)
       losing_trades = count(trades where profit < 0)
       total_trades = (count(BUY trades) + count(SELL trades)) / 2
       win_rate = (winning_trades / total_trades) × 100
       
       total_profit = sum(trades[profit])
       avg_profit = total_profit / total_trades
       best_trade = max(trades[profit])
       worst_trade = min(trades[profit])
    
    6. Benchmark (Buy & Hold)
       buy_price = prices[0]
       sell_price = prices[-1]
       shares = initial / buy_price
       benchmark_final = shares × sell_price
       benchmark_return = (benchmark_final - initial) / initial
    
    7. Comparison
       outperformance = total_return_pct - benchmark_return
    
    Return: Metrics dictionary
```

**Detailed Calculation Example:**
```
Given: 252 days of data, initial capital $10,000

Portfolio values over time:
$10,000 (Day 1)
$10,500 (Day 50)
$11,000 (Day 100)   ← Peak
$10,200 (Day 150)   ← Trough (Max Drawdown = -7.3%)
$12,500 (Day 252)

Calculations:
- Total Return = (12,500 - 10,000) / 10,000 = 25%
- Years = 252 / 252 = 1
- Annualized Return = 25%
- Daily volatility = 1.2% (example)
- Annual volatility = 1.2% × √252 = 19%
- Sharpe Ratio = (25% - 2%) / 19% = 1.21

Trades executed: 6 pairs
- Winning: 4 trades (avg +$400 each)
- Losing: 2 trades (avg -$150 each)
- Win Rate = 4/6 = 66.7%
- Avg Profit = $2,000 / 6 = $333.33

Buy & Hold:
- Entry: $10,000 / $41,800 = 0.239 shares
- Exit: 0.239 × $40,800 = $9,750
- Buy & Hold Return = -2.5%

Strategy vs Benchmark = 25% - (-2.5%) = +27.5% outperformance
```

---

## Complete Pseudocode

### End-to-End Algorithm (Simplified)

```
FUNCTION RUN_COMPLETE_BACKTEST(request):
    
    PHASE 1: VALIDATION
    ────────────────────
    VALIDATE_REQUEST(request)
    
    PHASE 2: FETCH DATA
    ────────────────────
    data = FETCH_HISTORICAL_DATA(request.ticker, request.start_date, request.end_date)
    VALIDATE_DATA(data)
    
    PHASE 3: CALCULATE INDICATORS
    ──────────────────────────────
    data['sma_fast'] = CALCULATE_SMA(data['close'], request.sma_fast)
    data['sma_slow'] = CALCULATE_SMA(data['close'], request.sma_slow)
    data['ema_fast'] = CALCULATE_EMA(data['close'], 12)
    data['ema_slow'] = CALCULATE_EMA(data['close'], 26)
    data['returns'] = CALCULATE_RETURNS(data['close'])
    data['volatility'] = CALCULATE_VOLATILITY(data['returns'])
    
    PHASE 4: GENERATE SIGNALS
    ─────────────────────────
    CASE request.strategy OF:
        'sma_crossover':     signals = GENERATE_SMA_SIGNALS(data)
        'ema_trend':         signals = GENERATE_EMA_SIGNALS(data)
        'momentum':          signals = GENERATE_MOMENTUM_SIGNALS(data)
        'mean_reversion':    signals = GENERATE_MEAN_REVERSION_SIGNALS(data)
    END CASE
    
    PHASE 5-8: EXECUTE TRADES
    ──────────────────────────
    portfolio_manager = INIT_PORTFOLIO_MANAGER(request.initial_capital)
    portfolio_values = []
    
    FOR each_day IN data:
        price = each_day['close']
        signal = signals[each_day.index]
        
        IF signal == 1 AND portfolio_manager.position_size == 0:
            shares = (portfolio_manager.cash × 0.95) / price
            cost = shares × price × (1 + request.transaction_cost)
            
            IF cost <= portfolio_manager.cash:
                portfolio_manager.EXECUTE_BUY(each_day['date'], price, shares)
        
        ELSE IF signal == -1 AND portfolio_manager.position_size > 0:
            portfolio_manager.EXECUTE_SELL(each_day['date'], price)
        
        current_value = portfolio_manager.GET_PORTFOLIO_VALUE(price)
        portfolio_values.APPEND(current_value)
    
    PHASE 9: CALCULATE METRICS
    ───────────────────────────
    metrics = CALCULATE_PERFORMANCE_METRICS(
        portfolio_values,
        portfolio_manager.trades,
        data['close']
    )
    
    PHASE 10-12: PREPARE & RETURN RESULTS
    ──────────────────────────────────────
    RETURN {
        'summary': metrics.summary,
        'risk_metrics': metrics.risk,
        'trade_statistics': metrics.trades,
        'trades': portfolio_manager.trades,
        'portfolio_values': portfolio_values,
        'dates': data['date'].tolist()
    }
END FUNCTION
```

---

## Data Structures

### Trade Record
```python
Trade = {
    'date': datetime,           # When trade happened
    'type': str,               # 'BUY' or 'SELL'
    'price': float,            # Execution price
    'shares': float,           # Number of shares
    'cost_or_proceeds': float, # Total cost or proceeds
    'profit': float,           # For SELL trades only
    'profit_pct': float        # For SELL trades only
}

Example:
{
    'date': datetime(2023, 2, 20),
    'type': 'BUY',
    'price': 43800.50,
    'shares': 0.217,
    'cost': 9522.00,
    'profit': None,
    'profit_pct': None
}
```

### Portfolio State
```python
PortfolioState = {
    'date': datetime,
    'price': float,
    'cash': float,              # Available cash
    'position_size': float,     # Shares held
    'position_value': float,    # shares × price
    'total_value': float,       # cash + position_value
    'daily_return': float,      # % change from yesterday
    'cumulative_return': float  # % from inception
}

Example:
{
    'date': datetime(2023, 6, 15),
    'price': 45200.00,
    'cash': 9500.00,
    'position_size': 0.217,
    'position_value': 9808.34,
    'total_value': 19308.34,
    'daily_return': 0.0045,
    'cumulative_return': 0.9308
}
```

### Results Package
```python
BacktestResults = {
    'summary': {
        'initial_capital': float,
        'final_value': float,
        'total_profit': float,
        'total_return_pct': float,
        'annualized_return_pct': float,
        'benchmark_return_pct': float,
        'strategy_vs_benchmark_pct': float
    },
    'risk_metrics': {
        'volatility_pct': float,
        'sharpe_ratio': float,
        'max_drawdown_pct': float,
        'max_drawdown_peak_date': str,
        'max_drawdown_trough_date': str,
        'best_month_return_pct': float,
        'worst_month_return_pct': float
    },
    'trade_statistics': {
        'total_trades': int,
        'winning_trades': int,
        'losing_trades': int,
        'win_rate_pct': float,
        'avg_profit_per_trade': float,
        'best_trade_profit': float,
        'worst_trade_loss': float,
        'avg_trade_duration_days': float
    },
    'trades': [Trade],
    'portfolio_values': [float],
    'portfolio_dates': [datetime]
}
```

---

## State Management

### State Transitions

```
STATE MACHINE:

┌─────────────┐
│   CREATED   │ (Request received)
└──────┬──────┘
       │ validate_request()
       ↓
┌─────────────┐
│  VALIDATED  │ (Input checks passed)
└──────┬──────┘
       │ fetch_data()
       ↓
┌─────────────┐
│ DATA_READY  │ (Historical data loaded)
└──────┬──────┘
       │ calculate_indicators()
       ↓
┌──────────────────┐
│ INDICATORS_CALC  │ (SMA, EMA, etc. computed)
└──────┬───────────┘
       │ generate_signals()
       ↓
┌────────────────┐
│ SIGNALS_READY  │ (Buy/Sell signals generated)
└──────┬─────────┘
       │ run_backtest()
       ↓
┌────────────────┐
│ BACKTEST_DONE  │ (Trades executed, metrics calculated)
└──────┬─────────┘
       │ format_results()
       ↓
┌────────────────┐
│  COMPLETED     │ (Ready for return to user)
└────────────────┘

POSSIBLE ERROR STATES:
- VALIDATION_FAILED (invalid inputs)
- DATA_FETCH_FAILED (API error)
- INSUFFICIENT_DATA (< 50 days)
- BACKTEST_ERROR (trade execution error)
```

### State Variables

```python
GlobalState = {
    'current_phase': str,  # Which phase we're in
    'backtest_id': str,    # Unique identifier
    'start_time': datetime,
    'end_time': datetime or None,
    'status': str,  # 'processing', 'completed', 'error'
    'progress_pct': float,  # 0-100
    'error_message': str or None,
    'data': DataFrame,
    'signals': Series,
    'portfolio_manager': PortfolioManager,
    'results': BacktestResults or None
}
```

---

## Error Handling Strategy

### Error Hierarchy

```
BacktestException (Base)
├── ValidationError
│   ├── InvalidDatesError
│   ├── InvalidCapitalError
│   ├── InvalidStrategyError
│   └── InvalidParametersError
├── DataError
│   ├── DataFetchError
│   ├── InsufficientDataError
│   └── DataQualityError
├── CalculationError
│   ├── IndicatorCalculationError
│   └── SignalGenerationError
├── ExecutionError
│   ├── TradeExecutionError
│   ├── InsufficientFundsError
│   └── PositionError
└── ResultsError
    ├── MetricsCalculationError
    └── ResultsFormattingError
```

### Error Recovery

```python
FUNCTION EXECUTE_BACKTEST_WITH_ERROR_HANDLING(request):
    
    TRY:
        PHASE 1
        ──────
        VALIDATE_REQUEST(request)
        IF VALIDATION_FAILED:
            RAISE ValidationError
        
        PHASE 2
        ──────
        data = FETCH_DATA(...)
        IF DATA_FETCH_FAILED:
            RAISE DataFetchError
            # RECOVER: Retry up to 3 times
            FOR retry = 1 TO 3:
                WAIT(exponential_backoff)
                TRY data = FETCH_DATA(...)
                IF SUCCESS: BREAK
        
        PHASE 3-12
        ──────────
        ... (calculate and backtest)
    
    CATCH ValidationError AS e:
        LOG_ERROR("Validation failed: " + e.message)
        RETURN {
            'status': 'error',
            'error_type': 'validation',
            'error_message': e.message,
            'timestamp': NOW()
        }
    
    CATCH DataFetchError AS e:
        LOG_ERROR("Data fetch failed: " + e.message)
        RETURN {
            'status': 'error',
            'error_type': 'data_fetch',
            'error_message': e.message,
            'timestamp': NOW()
        }
    
    CATCH Exception AS e:
        LOG_CRITICAL_ERROR("Unexpected error: " + e.message)
        RETURN {
            'status': 'error',
            'error_type': 'internal_error',
            'error_message': 'An unexpected error occurred',
            'timestamp': NOW()
        }
    
    FINALLY:
        CLEANUP_RESOURCES()
    
    RETURN results
END FUNCTION
```

---

## Real-World Examples

### Example 1: Complete Backtest Walkthrough

**Input:**
```
ticker: 'BTC-USD'
start_date: '2023-06-01'
end_date: '2023-08-31'
initial_capital: $5,000
strategy: 'sma_crossover'
sma_fast: 20
sma_slow: 50
transaction_cost: 0.001
```

**Execution Trace:**

```
PHASE 1: Validation
─────────────────
✓ Dates valid: 2023-06-01 < 2023-08-31
✓ Capital > 0: $5,000
✓ Strategy exists: 'sma_crossover'
✓ Parameters valid: 20 < 50

PHASE 2: Fetch Data
─────────────────
Calling yfinance.download('BTC-USD', '2023-06-01', '2023-08-31')...
Downloaded 63 days of data (trading days only)
Data shape: (63, 6)

Sample data:
         date    open     high      low    close    volume
0   2023-06-01  30500   31200    30300    30800  1234567
1   2023-06-02  30900   31500    30700    31200  1345678
...
62  2023-08-31  26400   26800    26200    26500  987654

PHASE 3: Calculate Indicators
──────────────────────────────
Calculating SMA_20 (last 20 days average)...
Calculating SMA_50 (last 50 days average)...
Calculating EMA and returns...

Sample with indicators (after day 50):
         date    close  sma_20    sma_50  signal
50   2023-07-21  29100  29850    30100      0
51   2023-07-22  29200  29900    30050     -1  ← DEATH CROSS
52   2023-07-23  28900  29750    30000      0
53   2023-07-24  29500  29850    29950      0
54   2023-07-25  30200  30050    29900      1  ← GOLDEN CROSS

PHASE 4: Generate Signals
──────────────────────────
Analyzing SMA crosses:
- Day 51: SMA20 (29900) < SMA50 (30050), Previous was >, so SELL (signal = -1)
- Day 54: SMA20 (30050) > SMA50 (29900), Previous was <, so BUY (signal = 1)

Total signals generated: 8 BUY, 7 SELL

PHASE 5-8: Execute Trades
──────────────────────────
Initial portfolio: $5,000 cash, 0 BTC

Trade #1 (Day 54): BUY Signal
  Price: $30,200
  Shares to buy: ($5,000 × 0.95) / $30,200 = 0.1575 BTC
  Cost (with fee): 0.1575 × $30,200 × 1.001 = $4,758
  Portfolio: $242 cash, 0.1575 BTC
  Portfolio Value: $242 + (0.1575 × $30,200) = $5,000

Trade #2 (Day 58): SELL Signal (Bitcoin rises to $31,500)
  Price: $31,500
  Proceeds (with fee): 0.1575 × $31,500 × 0.999 = $4,963
  Profit: $4,963 - $4,758 = $205
  Portfolio: $5,205 cash, 0 BTC
  Portfolio Value: $5,205

Trade #3 (Day 62): BUY Signal (Bitcoin falls to $27,000)
  ... (continues)

PHASE 9: Calculate Metrics
───────────────────────────
Final Portfolio Value: $5,420 (after all trades)

Returns:
- Total Profit: $5,420 - $5,000 = $420
- Total Return: 8.4%
- Annualized: 16.8% (2 months extrapolated)

Risk:
- Daily Volatility: 2.1%
- Annual Volatility: 33.3%
- Max Drawdown: -15.2% (peak: $30,800 → trough: $26,100)

Risk-Adjusted:
- Excess Return: 16.8% - 2% = 14.8%
- Sharpe Ratio: 14.8% / 33.3% = 0.44

Trades:
- Total Trades: 8 (8 buy/sell pairs)
- Winning Trades: 6
- Losing Trades: 2
- Win Rate: 75%
- Avg Profit/Trade: $52.50

Benchmark (Buy & Hold):
- Entry: $5,000 / $30,800 = 0.1623 BTC
- Exit: 0.1623 × $26,500 = $4,305
- Buy & Hold Return: -13.9%

Strategy vs Benchmark: 8.4% - (-13.9%) = +22.3% outperformance

PHASE 10-12: Return Results
────────────────────────────
{
  'status': 'completed',
  'summary': {
    'final_value': 5420.00,
    'total_return_pct': 8.4,
    'benchmark_return_pct': -13.9,
    'outperformance_pct': 22.3
  },
  'risk_metrics': {
    'sharpe_ratio': 0.44,
    'max_drawdown_pct': -15.2,
    'volatility_pct': 33.3
  },
  'trade_statistics': {
    'total_trades': 8,
    'win_rate_pct': 75.0,
    'avg_profit': 52.50
  },
  'trades': [
    {
      'entry_date': '2023-07-25',
      'entry_price': 30200,
      'exit_date': '2023-07-29',
      'exit_price': 31500,
      'profit': 205
    },
    ...
  ]
}
```

---

### Example 2: Multi-Strategy Comparison

**Algorithm for Strategy Comparison:**
```
FUNCTION COMPARE_STRATEGIES(ticker, dates, capital):
    
    strategies = ['sma_crossover', 'ema_trend', 'momentum', 'mean_reversion']
    results = {}
    
    FOR EACH strategy IN strategies:
        results[strategy] = RUN_BACKTEST(
            ticker=ticker,
            start_date=dates.start,
            end_date=dates.end,
            initial_capital=capital,
            strategy=strategy
        )
    
    # Rank by Sharpe Ratio
    ranked = SORT_BY_KEY(results, 'risk_metrics.sharpe_ratio', DESCENDING)
    
    RETURN ranked
END FUNCTION
```

**Results:**
```
Strategy          Return    Sharpe   Drawdown  Trades  Win%
──────────────────────────────────────────────────────────
1. SMA Crossover  +8.4%     0.44     -15.2%     8     75%
2. EMA Trend      +5.2%     0.38     -18.7%     12    65%
3. Momentum       +3.1%     0.22     -25.3%     15    52%
4. Mean Reversion -2.1%    -0.15     -32.1%     6     40%

Best Strategy: SMA Crossover (highest risk-adjusted returns)
```

---

## Performance Metrics Calculation

### Detailed Metrics Formula Reference

```
1. SIMPLE RETURN
   Return = (Final Value - Initial Value) / Initial Value
   Example: ($5,420 - $5,000) / $5,000 = 0.084 = 8.4%

2. ANNUALIZED RETURN
   Annualized = (Final / Initial) ^ (1 / years) - 1
   Example: ($5,420 / $5,000) ^ (1 / 0.167) - 1 = 0.168 = 16.8%

3. VOLATILITY (ANNUALIZED)
   Daily Vol = STDEV(daily_returns)
   Annual Vol = Daily Vol × √252
   Example: 0.021 × √252 = 0.333 = 33.3%

4. SHARPE RATIO
   Sharpe = (Annual Return - Risk Free Rate) / Annual Volatility
   Example: (0.168 - 0.02) / 0.333 = 0.44

5. MAX DRAWDOWN
   Running Max = cumulative maximum value seen
   Drawdown = (Current Value - Running Max) / Running Max
   Max DD = minimum drawdown
   Example: ($26,100 - $30,800) / $30,800 = -0.152 = -15.2%

6. WIN RATE
   Win Rate = Winning Trades / Total Trades × 100
   Example: 6 / 8 × 100 = 75%

7. PROFIT FACTOR
   Profit Factor = Gross Profit / Gross Loss
   Example: $840 / $420 = 2.0 (good)
```

---

## Advanced Considerations

### 1. Avoiding Overfitting

```
Problem: Strategy optimized on historical data may not work in future

Solution: Walk-Forward Analysis

PROCEDURE:
1. Split data into training + testing windows
   ├─ Training: 1 year of data (optimize parameters)
   └─ Testing: 3 months of data (evaluate out-of-sample)

2. For each window:
   ├─ Optimize parameters on training data
   ├─ Apply best parameters to test data
   └─ Record out-of-sample performance

3. Roll window forward and repeat
   Example:
   Walk 1: Train (2021), Test (Q1 2022)
   Walk 2: Train (2021-Q1 2022), Test (Q2 2022)
   Walk 3: Train (2021-Q2 2022), Test (Q3 2022)
   ...

4. Average out-of-sample results
   If close to historical performance → Strategy is robust
   If much worse → Strategy is overfitted
```

### 2. Risk Management

```
Position Sizing: Risk Percentage Method
   Risk Per Trade = Capital × Risk %
   Stop Loss = Entry Price × Stop Loss %
   Position Size = Risk Per Trade / Stop Loss %
   
Example:
   Capital: $10,000
   Risk %: 2% = $200
   Stop Loss: 5%
   Position Size = $200 / ($100 × 0.05) = 40 shares

Kelly Criterion:
   f* = (Win% × Avg Win) - (Loss% × Avg Loss)
   Position Size = f* × Capital
   Example: (60% × 1.5%) - (40% × 1%) = 0.50%
   Use 50% of position sizing formula for safety
```

### 3. Market Regime Detection

```
Identify market conditions before applying strategy

REGIMES:
1. Bull Market (uptrend)
   ├─ Trend following strategies work better
   └─ Use longer moving averages (50, 200)

2. Bear Market (downtrend)
   ├─ Mean reversion strategies work better
   └─ Consider going long on inverse ETFs

3. High Volatility
   ├─ Wider stop losses
   ├─ Smaller position sizes
   └─ Avoid mean reversion

4. Low Volatility
   ├─ Tight stop losses
   └─ Larger position sizes possible

DETECTION ALGORITHM:
   IF Close > EMA(200) AND Volume > Avg Volume:
       Market State = BULL
   ELSE IF Close < EMA(200) AND Volume < Avg Volume:
       Market State = BEAR
   ...
```

---

# Summary

This complete end-to-end algorithm provides:

✅ **No Look-Ahead Bias**: Uses only past data  
✅ **Realistic Costs**: Includes transaction fees  
✅ **Position Sizing**: Risk management (95% allocation)  
✅ **Complete Metrics**: Returns, risk, trade analysis  
✅ **Multi-Asset Support**: Works with any ticker  
✅ **Built-in Strategies**: 4 pre-built trading strategies  
✅ **Error Handling**: Comprehensive validation & recovery  
✅ **Scalable Design**: Ready for API integration  

The algorithm is production-ready for deployment in FastAPI backend and can power a React frontend dashboard for visualization and analysis.

