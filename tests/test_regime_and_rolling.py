import numpy as np
import pandas as pd
import pytest

from backtesting_engine import (
    Backtester, CorrelationAnalyzer, IndicatorCalculator, MarketRegimeAnalyzer,
)


def make_data(n=300, seed=11):
    rng = np.random.default_rng(seed)
    dates = pd.date_range("2022-01-01", periods=n, freq="D")
    closes = 100 + np.cumsum(rng.normal(0, 1.5, size=n))
    return pd.DataFrame({"date": dates, "close": closes})


def test_cumulative_returns_compounds_correctly():
    data = pd.DataFrame({"close": [100, 102, 104.04]})  # +2%, +2%
    cum = IndicatorCalculator.calculate_cumulative_returns(data)
    assert cum.iloc[0] == pytest.approx(0.0)
    assert cum.iloc[1] == pytest.approx(0.02)
    assert cum.iloc[2] == pytest.approx(0.0404, abs=1e-4)


def test_rolling_returns_matches_pct_change_window():
    data = pd.DataFrame({"close": [100, 101, 102, 103, 110]})
    rolling = IndicatorCalculator.calculate_rolling_returns(data, window=3)
    assert pd.isna(rolling.iloc[2])  # not enough history yet (needs 3 periods back)
    assert rolling.iloc[3] == pytest.approx((103 - 100) / 100)
    assert rolling.iloc[4] == pytest.approx((110 - 101) / 101)


def test_calculate_all_indicators_includes_new_columns():
    data = IndicatorCalculator.calculate_all_indicators(make_data())
    assert "cumulative_returns" in data.columns
    assert "rolling_returns" in data.columns


def test_rolling_correlation_pair_moves_with_relationship():
    n = 200
    rng = np.random.default_rng(5)
    dates = pd.date_range("2023-01-01", periods=n, freq="D")
    base = rng.normal(0, 1, n)
    asset_a = pd.DataFrame({"date": dates, "close": 100 + np.cumsum(base)})
    # asset_b tracks asset_a almost perfectly -> correlation should be strongly positive
    asset_b = pd.DataFrame({"date": dates, "close": 50 + np.cumsum(base) * 0.9 + rng.normal(0, 0.01, n)})

    result = CorrelationAnalyzer.calculate_rolling_correlation_pair(
        {"A": asset_a, "B": asset_b}, "A", "B", window=30
    )
    assert list(result.columns) == ["date", "rolling_correlation"]
    valid = result["rolling_correlation"].dropna()
    assert valid.mean() > 0.8


def test_regime_classification_labels_known_trend():
    n = 300
    dates = pd.date_range("2022-01-01", periods=n, freq="D")
    # Flat then a strong sustained rally -> back half should classify as Bull.
    closes = [100] * 220 + [100 + i * 0.8 for i in range(80)]
    data = pd.DataFrame({"date": dates, "close": closes})

    regime = MarketRegimeAnalyzer.classify_regime(data, trend_period=200, vol_window=30)
    assert regime.iloc[-1].startswith("Bull")
    assert set(regime.unique()) <= {"Bull-HighVol", "Bull-LowVol", "Bear-HighVol", "Bear-LowVol", "Unknown"}


def test_analyze_by_regime_breaks_down_returns():
    data = IndicatorCalculator.calculate_all_indicators(make_data())
    results = Backtester(data, initial_capital=10000, strategy="sma_crossover").run()

    breakdown = MarketRegimeAnalyzer.analyze_by_regime(results, data)
    assert isinstance(breakdown, dict)
    for label, stats in breakdown.items():
        assert stats["days"] > 0
        assert "avg_daily_return_percent" in stats
        assert "volatility_percent" in stats
