import numpy as np
import pandas as pd
import pytest

from backtesting_engine import Backtester, IndicatorCalculator


def make_data(n=200, seed=21):
    rng = np.random.default_rng(seed)
    dates = pd.date_range("2023-01-01", periods=n, freq="D")
    closes = 100 + np.cumsum(rng.normal(0, 1.5, size=n))
    return pd.DataFrame({"date": dates, "close": closes})


def test_rsi_bounded_0_to_100():
    rsi = IndicatorCalculator.calculate_rsi(make_data())
    valid = rsi.dropna()
    assert (valid >= 0).all() and (valid <= 100).all()


def test_rsi_pure_uptrend_is_high():
    data = pd.DataFrame({"close": [100 + i for i in range(30)]})  # monotonic rise, no losses
    rsi = IndicatorCalculator.calculate_rsi(data, period=14)
    assert rsi.iloc[-1] > 90  # no losses at all -> RSI approaches 100


def test_macd_histogram_equals_macd_minus_signal():
    macd = IndicatorCalculator.calculate_macd(make_data())
    diff = (macd['macd'] - macd['signal'] - macd['histogram']).abs()
    assert diff.max() < 1e-9


def test_bollinger_bands_ordering():
    bb = IndicatorCalculator.calculate_bollinger_bands(make_data())
    valid = pd.DataFrame(bb).dropna()
    assert (valid['upper'] >= valid['middle']).all()
    assert (valid['middle'] >= valid['lower']).all()


def test_calculate_all_indicators_includes_new_columns():
    data = IndicatorCalculator.calculate_all_indicators(make_data())
    for col in ['rsi', 'macd', 'macd_signal', 'macd_histogram', 'bb_upper', 'bb_middle', 'bb_lower']:
        assert col in data.columns


def test_calmar_ratio_zero_when_no_drawdown():
    # Monotonically increasing portfolio -> no drawdown -> function must not divide by zero.
    values = pd.Series([100, 101, 102, 103, 104])
    result = IndicatorCalculator.calculate_calmar_ratio(values)
    assert result == 0


def test_calmar_ratio_present_in_backtest_results():
    data = IndicatorCalculator.calculate_all_indicators(make_data())
    results = Backtester(data, initial_capital=10000, strategy="sma_crossover").run()
    assert 'calmar_ratio' in results['risk_metrics']
