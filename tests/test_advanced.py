import numpy as np
import pandas as pd
import pytest

import backtesting_engine as be
from backtesting_engine import (
    DataFetcher, MonteCarloSimulator, ParameterOptimizer, RollingAnalyzer,
    WalkForwardAnalyzer,
)


def make_data(n=400, seed=7):
    rng = np.random.default_rng(seed)
    dates = pd.date_range("2022-01-01", periods=n, freq="D")
    closes = 100 + np.cumsum(rng.normal(0, 1.5, size=n))
    return pd.DataFrame({
        "date": dates,
        "open": closes, "high": closes, "low": closes, "close": closes,
        "volume": np.full(n, 1_000_000),
    })


@pytest.fixture
def no_network(monkeypatch):
    """All three grid/walk-forward/rolling classes fetch through DataFetcher.fetch_data —
    stub it once so tests never touch yfinance."""
    data = make_data()
    monkeypatch.setattr(DataFetcher, "fetch_data", staticmethod(lambda ticker, start, end: data.copy()))


def test_parameter_optimizer_grid_search_ranks_by_sharpe(no_network):
    results = ParameterOptimizer.grid_search(
        ticker="BTC-USD", start_date="2022-01-01", end_date="2023-01-01",
        strategy="sma_crossover", initial_capital=10000,
        param_ranges={"sma_fast": [10, 20], "sma_slow": [40, 50]},
    )
    assert len(results) == 4  # 2 x 2 grid
    sharpes = [r["sharpe_ratio"] for r in results]
    assert sharpes == sorted(sharpes, reverse=True)
    assert all("parameters" in r for r in results)


def test_walk_forward_produces_out_of_sample_results(no_network):
    result = WalkForwardAnalyzer.run_walk_forward(
        ticker="BTC-USD", start_date="2022-01-01", end_date="2023-02-01",
        strategy="sma_crossover", initial_capital=10000,
        optimization_period=252, testing_period=63,
    )
    assert len(result["walk_forward_results"]) >= 1
    assert "average_out_of_sample_sharpe" in result


def test_monte_carlo_simulation_shape_and_var():
    returns = pd.Series(np.random.default_rng(1).normal(0.001, 0.02, size=252))
    result = MonteCarloSimulator.run_monte_carlo(
        returns, initial_capital=10000, num_simulations=500, days_ahead=60
    )
    assert result["simulations"] == 500
    assert result["percentile_values"]["p50"] == pytest.approx(result["final_value_median"])
    # VaR should be non-negative when the 5th percentile is below initial capital
    assert result["var_95"] >= -1e-6


def test_rolling_analyzer_returns_dataframe(no_network):
    df = RollingAnalyzer.calculate_rolling_metrics(
        ticker="BTC-USD", start_date="2022-01-01", end_date="2023-01-01",
        strategy="sma_crossover", window_days=252,
    )
    assert isinstance(df, pd.DataFrame)
    assert "sharpe" in df.columns
