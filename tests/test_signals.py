import pandas as pd
import pytest

from backtesting_engine import IndicatorCalculator, SignalGenerator


def make_trending_data(n=80):
    dates = pd.date_range("2024-01-01", periods=n, freq="D")
    # A dip then a rally forces both a golden cross and a death cross.
    closes = [100 + i * 0.1 for i in range(30)] + \
             [103 - i * 0.3 for i in range(20)] + \
             [97 + i * 0.5 for i in range(30)]
    return pd.DataFrame({"date": dates, "close": closes[:n]})


def test_sma_crossover_generates_signals():
    # From COMPLETE_PIPELINE.md's own test example.
    data = make_trending_data()
    data = IndicatorCalculator.calculate_all_indicators(data, sma_fast=5, sma_slow=15)
    signals = SignalGenerator.sma_crossover(data)
    assert (signals != 0).any(), "Should have at least one signal"


def test_sma_crossover_no_look_ahead_bias():
    """A signal at day i must only depend on data at indices <= i."""
    data = make_trending_data()
    data = IndicatorCalculator.calculate_all_indicators(data, sma_fast=5, sma_slow=15)
    full_signals = SignalGenerator.sma_crossover(data)

    # Truncate the series at some midpoint and recompute; earlier signals must be identical
    # (a look-ahead bug would let later rows change earlier signal values).
    cutoff = 50
    truncated = data.iloc[:cutoff].copy()
    truncated_signals = SignalGenerator.sma_crossover(truncated)

    pd.testing.assert_series_equal(
        full_signals.iloc[:cutoff], truncated_signals, check_names=False
    )


def test_momentum_buy_when_momentum_turns_positive():
    dates = pd.date_range("2024-01-01", periods=20, freq="D")
    closes = [100] * 15 + [101, 103, 106, 110, 115]  # flat then breakout
    data = pd.DataFrame({"date": dates, "close": closes})
    signals = SignalGenerator.momentum(data, period=14)
    assert (signals == 1).any()


def test_mean_reversion_buy_below_lower_band():
    dates = pd.date_range("2024-01-01", periods=25, freq="D")
    closes = [100] * 20 + [80, 79, 78, 77, 76]  # sharp drop below the band
    data = pd.DataFrame({"date": dates, "close": closes})
    signals = SignalGenerator.mean_reversion(data, period=20, std_dev=2)
    assert (signals == 1).any()
