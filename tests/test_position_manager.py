import pytest

from backtesting_engine import PositionManager


def test_calculate_position_size():
    pm = PositionManager(initial_capital=10000)
    shares = pm.calculate_position_size(price=100, risk_percent=0.95)
    assert shares == pytest.approx((10000 * 0.95) / 100)


def test_execute_buy_deducts_cash_with_fee():
    pm = PositionManager(initial_capital=10000, transaction_cost=0.001)
    ok = pm.execute_buy("2024-01-01", price=100, shares=10)
    assert ok is True
    assert pm.position_size == 10
    assert pm.cash == pytest.approx(10000 - 100 * 10 * 1.001)


def test_execute_buy_rejected_when_insufficient_cash():
    pm = PositionManager(initial_capital=100)
    ok = pm.execute_buy("2024-01-01", price=100, shares=10)  # costs way more than cash
    assert ok is False
    assert pm.position_size == 0
    assert pm.cash == 100


def test_execute_sell_computes_profit_and_clears_position():
    pm = PositionManager(initial_capital=10000, transaction_cost=0.001)
    pm.execute_buy("2024-01-01", price=100, shares=10)
    profit = pm.execute_sell("2024-01-02", price=110)

    cost_basis = 100 * 10 * 1.001
    proceeds = 110 * 10 * 0.999
    assert profit == pytest.approx(proceeds - cost_basis)
    assert pm.position_size == 0
    assert pm.cash == pytest.approx(10000 - cost_basis + proceeds)


def test_execute_sell_with_no_position_is_noop():
    pm = PositionManager(initial_capital=10000)
    assert pm.execute_sell("2024-01-01", price=100) == 0


def test_get_portfolio_value():
    pm = PositionManager(initial_capital=10000, transaction_cost=0.001)
    pm.execute_buy("2024-01-01", price=100, shares=10)
    assert pm.get_portfolio_value(current_price=120) == pytest.approx(pm.cash + 10 * 120)
