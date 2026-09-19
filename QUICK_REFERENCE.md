# Quick Reference Guide
## Backtesting Platform - Fast Implementation Guide

---

## 📋 Core Functions Quick Reference

### Data Fetching
```python
from backtesting_engine import DataFetcher

# Fetch data
data = DataFetcher.fetch_data('BTC-USD', '2023-01-01', '2024-01-01')

# Validate
DataFetcher.validate_data(data)
```

### Indicators
```python
from backtesting_engine import IndicatorCalculator

# Calculate all at once
data = IndicatorCalculator.calculate_all_indicators(data, sma_fast=20, sma_slow=50)

# Or individual
sma = IndicatorCalculator.calculate_sma(data, 20)
ema = IndicatorCalculator.calculate_ema(data, 12)
returns = IndicatorCalculator.calculate_returns(data)
```

### Signals
```python
from backtesting_engine import SignalGenerator

# Generate based on strategy
signals = SignalGenerator.sma_crossover(data)  # Returns [1, 0, -1]
signals = SignalGenerator.ema_trend(data)
signals = SignalGenerator.momentum(data)
signals = SignalGenerator.mean_reversion(data)
```

### Backtest
```python
from backtesting_engine import run_backtest

results = run_backtest(
    ticker='BTC-USD',
    start_date='2023-01-01',
    end_date='2024-01-01',
    initial_capital=10000,
    strategy='sma_crossover',
    transaction_cost=0.001,
    sma_fast=20,
    sma_slow=50
)

# Access results
print(results['summary'])
print(results['risk_metrics'])
print(results['trade_statistics'])
```

---

## 📊 Results Structure

```python
results = {
    'summary': {
        'initial_capital': 10000,
        'final_value': 12500,
        'total_profit': 2500,
        'total_return_percent': 25.0,
        'benchmark_return_percent': 15.0,
        'strategy_vs_benchmark_percent': 10.0
    },
    'risk_metrics': {
        'volatility_percent': 28.5,
        'sharpe_ratio': 0.87,
        'max_drawdown_percent': -18.2,
        'max_drawdown_peak_date': '2023-06-15',
        'max_drawdown_trough_date': '2023-08-20'
    },
    'trade_statistics': {
        'total_trades': 12,
        'winning_trades': 8,
        'losing_trades': 4,
        'win_rate_percent': 66.67,
        'average_profit_per_trade': 208.33,
        'best_trade_profit': 1200,
        'worst_trade_loss': -450
    },
    'trades': [
        {
            'entry_date': '2023-01-15',
            'entry_price': 25000,
            'exit_date': '2023-02-20',
            'exit_price': 27500,
            'profit': 912.50
        }
    ],
    'portfolio_values': [10000, 10050, 10100, ...],
    'portfolio_dates': ['2023-01-01', '2023-01-02', ...]
}
```

---

## 🎯 Strategy Comparison

```python
strategies = ['sma_crossover', 'ema_trend', 'momentum', 'mean_reversion']
results = {}

for strategy in strategies:
    results[strategy] = run_backtest(
        ticker='BTC-USD',
        start_date='2023-01-01',
        end_date='2024-01-01',
        initial_capital=10000,
        strategy=strategy
    )

# Best by Sharpe ratio
best = max(results.items(), 
           key=lambda x: x[1]['risk_metrics']['sharpe_ratio'])
print(f"Best strategy: {best[0]}")
```

---

## 🔧 Parameter Optimization

```python
from backtesting_engine import ParameterOptimizer

results = ParameterOptimizer.grid_search(
    ticker='BTC-USD',
    start_date='2023-01-01',
    end_date='2024-01-01',
    strategy='sma_crossover',
    initial_capital=10000,
    param_ranges={
        'sma_fast': [10, 20, 30],
        'sma_slow': [40, 50, 60],
        'transaction_cost': [0.0005, 0.001]
    }
)

# results is sorted by Sharpe ratio (best first)
best_params = results[0]['parameters']
print(f"Best params: {best_params}")
```

---

## 📈 Multi-Asset Analysis

```python
from backtesting_engine import run_multi_asset_analysis

corr_results = run_multi_asset_analysis(
    tickers=['BTC-USD', 'GLD', 'NVDA'],
    start_date='2023-01-01',
    end_date='2024-01-01'
)

# Correlation matrix
print(corr_results['correlation_matrix'])

# Interpretations
for pair, interp in corr_results['interpretation'].items():
    print(f"{pair}: {interp}")
```

---

## 🛡️ Risk Analysis

```python
from backtesting_engine import MonteCarloSimulator

# After running backtest
returns = results['portfolio_values']  # Use as percent change
data = DataFetcher.fetch_data('BTC-USD', '2023-01-01', '2024-01-01')
returns = IndicatorCalculator.calculate_returns(data)

mc_results = MonteCarloSimulator.run_monte_carlo(
    returns=returns,
    initial_capital=10000,
    num_simulations=5000,
    days_ahead=252
)

print(f"Expected Value: ${mc_results['final_value_mean']:,.2f}")
print(f"95% Confidence: ${mc_results['confidence_intervals']['95%']}")
print(f"Value at Risk: ${mc_results['var_95']:,.2f}")
```

---

## 🧪 Walk-Forward Analysis

```python
from backtesting_engine import WalkForwardAnalyzer

wf_results = WalkForwardAnalyzer.run_walk_forward(
    ticker='BTC-USD',
    start_date='2022-01-01',
    end_date='2024-01-01',
    strategy='sma_crossover',
    initial_capital=10000,
    optimization_period=252,  # 1 year
    testing_period=63         # 3 months
)

print(f"Avg Out-of-Sample Return: {wf_results['average_out_of_sample_return']:.2f}%")
print(f"Avg Out-of-Sample Sharpe: {wf_results['average_out_of_sample_sharpe']:.2f}")
```

---

## 🚀 FastAPI Endpoints

### POST /api/v1/backtest
```bash
curl -X POST http://localhost:8000/api/v1/backtest \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "BTC-USD",
    "start_date": "2023-01-01",
    "end_date": "2024-01-01",
    "initial_capital": 10000,
    "strategy": "sma_crossover",
    "sma_fast": 20,
    "sma_slow": 50
  }'
```

Response:
```json
{
  "backtest_id": "uuid-1234",
  "status": "processing"
}
```

### GET /api/v1/backtest/{backtest_id}
```bash
curl http://localhost:8000/api/v1/backtest/uuid-1234
```

Response:
```json
{
  "status": "completed",
  "results": { ... }
}
```

### POST /api/v1/correlation
```bash
curl -X POST http://localhost:8000/api/v1/correlation \
  -H "Content-Type: application/json" \
  -d '{
    "tickers": ["BTC-USD", "GLD", "NVDA"],
    "start_date": "2023-01-01",
    "end_date": "2024-01-01"
  }'
```

---

## 📝 Example: Complete Pipeline

```python
from backtesting_engine import (
    DataFetcher, IndicatorCalculator, SignalGenerator,
    Backtester, ParameterOptimizer, run_backtest, run_multi_asset_analysis
)

# Step 1: Fetch data
print("Fetching data...")
data = DataFetcher.fetch_data('BTC-USD', '2023-01-01', '2024-01-01')
DataFetcher.validate_data(data)

# Step 2: Calculate indicators
print("Calculating indicators...")
data = IndicatorCalculator.calculate_all_indicators(data)

# Step 3: Generate signals
print("Generating signals...")
signals = SignalGenerator.sma_crossover(data)

# Step 4: Run backtest
print("Running backtest...")
backtester = Backtester(data, 10000, 0.001, 'sma_crossover')
results = backtester.run()

# Step 5: Display results
print("\n" + "="*60)
print("BACKTEST RESULTS")
print("="*60)
print(f"Return: {results['summary']['total_return_percent']:.2f}%")
print(f"Sharpe: {results['risk_metrics']['sharpe_ratio']:.2f}")
print(f"Max DD: {results['risk_metrics']['max_drawdown_percent']:.2f}%")
print(f"Trades: {results['trade_statistics']['total_trades']}")
print(f"Win Rate: {results['trade_statistics']['win_rate_percent']:.2f}%")

# Step 6: Optimize parameters
print("\nOptimizing parameters...")
opt_results = ParameterOptimizer.grid_search(
    'BTC-USD', '2023-01-01', '2024-01-01', 'sma_crossover', 10000,
    {'sma_fast': [10, 20, 30], 'sma_slow': [40, 50, 60]}
)
print(f"Best params: {opt_results[0]['parameters']}")

# Step 7: Multi-asset analysis
print("\nAnalyzing multiple assets...")
corr = run_multi_asset_analysis(
    ['BTC-USD', 'GLD', 'NVDA'], '2023-01-01', '2024-01-01'
)
print(f"Correlation matrix:\n{corr['correlation_matrix']}")
```

---

## 🔍 Debugging Checklist

- [ ] Data has required columns (OHLCV)
- [ ] Data has minimum 50 points
- [ ] No NaN values in close prices
- [ ] SMA periods are different (fast < slow)
- [ ] Signals don't look ahead (only use past data)
- [ ] Trades execute only when signal changes
- [ ] Portfolio value includes cash + position value
- [ ] Transaction costs applied to all trades
- [ ] Position size calculation is correct
- [ ] Metrics formulas are standard

---

## ⚡ Performance Tips

1. **Cache data**
   ```python
   from backtesting_engine import CachedDataFetcher
   data = CachedDataFetcher.fetch_cached(ticker, start, end)
   ```

2. **Use vectorized operations** (already in code)
   ```python
   # ✓ Good (vectorized)
   sma = data['close'].rolling(20).mean()
   
   # ✗ Bad (loop)
   sma = []
   for i in range(len(data)):
       sma.append(data[i:i+20].mean())
   ```

3. **Batch optimizations**
   ```python
   # Test 16 combinations (fast)
   param_ranges = {'sma_fast': [20, 30], 'sma_slow': [50, 60]}
   
   # Not 100 combinations (slow)
   param_ranges = {'sma_fast': range(10, 40), 'sma_slow': range(40, 100)}
   ```

4. **Use shorter date ranges for testing**
   ```python
   # Quick test (3 months)
   results = run_backtest(..., start_date='2023-10-01', end_date='2024-01-01')
   
   # Full test (1 year) after verification
   results = run_backtest(..., start_date='2023-01-01', end_date='2024-01-01')
   ```

---

## 📚 Document Map

| Document | Purpose | When to Use |
|----------|---------|------------|
| BACKTESTING_ENGINE_PRODUCTION.md | Complete code | Implementation |
| END_TO_END_BACKTESTING_ALGORITHM.md | Algorithm logic | Understanding |
| BACKEND_ARCHITECTURE.md | System design | Infrastructure |
| COMPLETE_PIPELINE.md | Development timeline | Planning |
| INTEGRATION_GUIDE.md | How to connect | Integration |
| QUICK_REFERENCE.md | Fast lookup | Development |

---

## 🎓 Learning Path

1. **Day 1**: Read BACKTESTING_ENGINE_PRODUCTION.md overview
2. **Day 2**: Study END_TO_END_BACKTESTING_ALGORITHM.md phases
3. **Day 3**: Implement core modules (DataFetcher → Backtester)
4. **Day 4**: Build FastAPI endpoints (see BACKEND_ARCHITECTURE.md)
5. **Day 5**: Create React frontend + deploy

---

## 🐛 Common Errors & Fixes

### "Not enough data points (need at least 50 days)"
```python
# ✗ Wrong
results = run_backtest(..., start_date='2024-01-01', end_date='2024-01-05')

# ✓ Correct
results = run_backtest(..., start_date='2023-01-01', end_date='2024-01-01')
```

### "No trades executed"
```python
# ✗ Problem: SMA parameters wrong
results = run_backtest(..., sma_fast=200, sma_slow=500)

# ✓ Solution: Adjust parameters
results = run_backtest(..., sma_fast=20, sma_slow=50)
```

### "High transaction costs"
```python
# ✗ Problem: Too high
results = run_backtest(..., transaction_cost=0.05)  # 5%

# ✓ Realistic
results = run_backtest(..., transaction_cost=0.001)  # 0.1%
```

### "Negative portfolio value"
```python
# ✗ Problem: Capital too small
results = run_backtest(..., initial_capital=100, strategy='sma_crossover')

# ✓ Solution: Adequate capital
results = run_backtest(..., initial_capital=10000, strategy='sma_crossover')
```

---

## 🎯 Key Formulas

```
Total Return % = ((Final - Initial) / Initial) × 100
Annualized Return = (Final / Initial) ^ (1/years) - 1
Volatility = Std Dev of Returns × √252
Sharpe Ratio = (Return - Risk Free Rate) / Volatility
Max Drawdown = (Trough - Peak) / Peak
Win Rate = (Winning Trades / Total Trades) × 100
```

---

## 🔗 Integration Points

**Backend → Frontend**
```javascript
// Fetch backtest results
fetch('/api/v1/backtest/uuid-1234')
  .then(r => r.json())
  .then(data => {
    drawChart(data.portfolio_values);
    updateMetrics(data.risk_metrics);
    displayTrades(data.trades);
  });
```

**Backend → Database**
```python
# Save results
repository.save_backtest_results(
    backtest_id=uuid,
    results=results,
    timestamp=datetime.now()
)
```

**Backend → Cache**
```python
# Cache price data
cache.set(
    key=f"prices:{ticker}:{start}:{end}",
    value=data.to_json(),
    ttl=24*3600  # 24 hours
)
```

---

## 📞 Support Resources

- **Algorithm Logic**: END_TO_END_BACKTESTING_ALGORITHM.md
- **Code Implementation**: BACKTESTING_ENGINE_PRODUCTION.md
- **API Documentation**: BACKEND_ARCHITECTURE.md
- **Integration Help**: INTEGRATION_GUIDE.md

---

**Last Updated**: September 19, 2026  
**Version**: 1.0  
**Status**: Production Ready

