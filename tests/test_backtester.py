import numpy as np
import pandas as pd
import pytest

from backtesting_engine import Backtester, IndicatorCalculator, validate_request


def make_data(n=200, seed=42):
    rng = np.random.default_rng(seed)
    dates = pd.date_range("2023-01-01", periods=n, freq="D")
    # Random walk so different strategies actually produce different trades.
    closes = 100 + np.cumsum(rng.normal(0, 1.5, size=n))
    return pd.DataFrame({"date": dates, "close": closes})


@pytest.mark.parametrize("strategy", ["sma_crossover", "ema_trend", "momentum", "mean_reversion"])
def test_backtester_runs_each_strategy_without_error(strategy):
    data = IndicatorCalculator.calculate_all_indicators(make_data())
    results = Backtester(data, initial_capital=10000, strategy=strategy).run()

    assert results["summary"]["initial_capital"] == 10000
    assert "sharpe_ratio" in results["risk_metrics"]
    assert results["trade_statistics"]["total_trades"] >= 0
    assert len(results["portfolio_values"]) == len(data)


def test_backtester_unknown_strategy_raises():
    data = IndicatorCalculator.calculate_all_indicators(make_data())
    with pytest.raises(ValueError):
        Backtester(data, initial_capital=10000, strategy="not_a_real_strategy").run()


def test_backtester_no_trades_when_flat_price():
    # A perfectly flat price never crosses any moving average -> zero trades, zero return.
    dates = pd.date_range("2023-01-01", periods=100, freq="D")
    data = pd.DataFrame({"date": dates, "close": [100.0] * 100})
    data = IndicatorCalculator.calculate_all_indicators(data)
    results = Backtester(data, initial_capital=10000, strategy="sma_crossover").run()

    assert results["trade_statistics"]["total_trades"] == 0
    assert results["summary"]["final_portfolio_value"] == 10000


def test_validate_request_accepts_good_input():
    validate_request("BTC-USD", "2023-01-01", "2024-01-01", 10000,
                     "sma_crossover", 0.001, 20, 50)  # should not raise


@pytest.mark.parametrize("kwargs,bad_field", [
    (dict(start_date="2024-01-01", end_date="2023-01-01"), "date"),
    (dict(initial_capital=-1), "capital"),
    (dict(strategy="nope"), "strategy"),
    (dict(sma_fast=50, sma_slow=20), "sma_fast"),
    (dict(transaction_cost=1.0), "transaction_cost"),
])
def test_validate_request_rejects_bad_input(kwargs, bad_field):
    defaults = dict(
        ticker="BTC-USD", start_date="2023-01-01", end_date="2024-01-01",
        initial_capital=10000, strategy="sma_crossover",
        transaction_cost=0.001, sma_fast=20, sma_slow=50,
    )
    defaults.update(kwargs)
    with pytest.raises(ValueError, match=bad_field):
        validate_request(**defaults)
