import pandas as pd
import pytest

from backtesting_engine import IndicatorCalculator


def make_data(closes):
    return pd.DataFrame({"close": closes})


def test_sma_calculation():
    # From COMPLETE_PIPELINE.md's own test example.
    data = make_data([1, 2, 3, 4, 5])
    result = IndicatorCalculator.calculate_sma(data, 3)

    assert pd.isna(result.iloc[0])
    assert pd.isna(result.iloc[1])
    assert result.iloc[2] == 2.0
    assert result.iloc[3] == 3.0
    assert result.iloc[4] == 4.0


def test_ema_first_valid_value_is_close_price():
    data = make_data([100, 102, 104, 106, 108])
    result = IndicatorCalculator.calculate_ema(data, 3)
    assert result.iloc[0] == 100  # adjust=False seeds EMA at the first close
    assert not pd.isna(result.iloc[1])


def test_returns_calculation():
    data = make_data([100, 102, 99])
    returns = IndicatorCalculator.calculate_returns(data)
    assert pd.isna(returns.iloc[0])
    assert returns.iloc[1] == pytest.approx(0.02)
    assert returns.iloc[2] == pytest.approx((99 - 102) / 102)


def test_volatility_scales_with_sqrt_252():
    returns = pd.Series([0.01, -0.01, 0.02, -0.02, 0.01])
    vol = IndicatorCalculator.calculate_volatility(returns)
    assert vol == pytest.approx(returns.std() * (252 ** 0.5))


def test_sharpe_ratio_zero_volatility_returns_zero():
    returns = pd.Series([0.0, 0.0, 0.0])
    assert IndicatorCalculator.calculate_sharpe_ratio(returns) == 0


def test_max_drawdown_known_sequence():
    # Portfolio: 100 -> 150 (peak) -> 90 (trough) -> 140
    values = pd.Series(
        [100, 150, 90, 140],
        index=pd.to_datetime(["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04"]),
    )
    dd, peak_date, trough_date = IndicatorCalculator.calculate_max_drawdown(values)
    assert dd == pytest.approx((90 - 150) / 150)
    assert peak_date == "2024-01-02"
    assert trough_date == "2024-01-03"


def test_correlation_perfect_positive():
    a = pd.Series([1, 2, 3, 4, 5])
    b = pd.Series([2, 4, 6, 8, 10])
    assert IndicatorCalculator.calculate_correlation(a, b) == pytest.approx(1.0)
