import os
import uuid

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from main import app
from backtesting_engine import DataFetcher

client = TestClient(app)


@pytest.fixture
def auth_headers():
    email = f"test-{uuid.uuid4()}@example.com"
    password = "correct-horse-battery-staple"
    reg = client.post("/api/v1/auth/register", json={"email": email, "password": password})
    assert reg.status_code == 201, reg.text
    login = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _synthetic_data(n=300, seed=3):
    rng = np.random.default_rng(seed)
    dates = pd.date_range("2022-01-01", periods=n, freq="D")
    closes = 100 + np.cumsum(rng.normal(0, 1.5, size=n))
    return pd.DataFrame({
        "date": dates,
        "open": closes, "high": closes, "low": closes, "close": closes,
        "volume": np.full(n, 1_000_000),
    })


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


def test_api_health():
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200


def test_list_strategies():
    resp = client.get("/api/v1/strategies")
    assert resp.status_code == 200
    ids = {s["id"] for s in resp.json()["strategies"]}
    assert ids == {"sma_crossover", "ema_trend", "momentum", "mean_reversion"}


def test_backtest_requires_auth():
    resp = client.post("/api/v1/backtest", json={
        "ticker": "BTC-USD", "start_date": "2023-01-01", "end_date": "2024-01-01",
    })
    assert resp.status_code == 401


def test_backtest_invalid_strategy_returns_400_without_network(auth_headers):
    # validate_request() runs before any data fetch, so this must fail fast.
    resp = client.post("/api/v1/backtest", headers=auth_headers, json={
        "ticker": "BTC-USD", "start_date": "2023-01-01", "end_date": "2024-01-01",
        "strategy": "not_a_strategy",
    })
    assert resp.status_code == 400


def test_backtest_bad_dates_returns_400(auth_headers):
    resp = client.post("/api/v1/backtest", headers=auth_headers, json={
        "ticker": "BTC-USD", "start_date": "2024-01-01", "end_date": "2023-01-01",
    })
    assert resp.status_code == 400


def test_backtest_accepted_dispatches_pending(auth_headers, monkeypatch):
    monkeypatch.setattr(
        DataFetcher, "fetch_data",
        staticmethod(lambda ticker, start, end: _synthetic_data()),
    )
    resp = client.post("/api/v1/backtest", headers=auth_headers, json={
        "ticker": "BTC-USD", "start_date": "2023-01-01", "end_date": "2024-01-01",
        "strategy": "sma_crossover",
    })
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "pending"
    assert body["backtest_id"]


def test_get_backtest_not_found_returns_404():
    resp = client.get("/api/v1/backtest/does-not-exist")
    assert resp.status_code == 404


def test_register_duplicate_email_rejected(auth_headers):
    # auth_headers already registered one email; grab it and try again via a second register.
    email = f"dup-{uuid.uuid4()}@example.com"
    first = client.post("/api/v1/auth/register", json={"email": email, "password": "pw123456"})
    assert first.status_code == 201
    second = client.post("/api/v1/auth/register", json={"email": email, "password": "pw123456"})
    assert second.status_code == 400


def test_login_wrong_password_rejected(auth_headers):
    email = f"wrongpw-{uuid.uuid4()}@example.com"
    client.post("/api/v1/auth/register", json={"email": email, "password": "correct-pw"})
    resp = client.post("/api/v1/auth/login", data={"username": email, "password": "wrong-pw"})
    assert resp.status_code == 401


def test_me_returns_current_user(auth_headers):
    resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert "@" in resp.json()["email"]


def test_me_without_token_rejected():
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_optimize_returns_top_results(monkeypatch):
    monkeypatch.setattr(
        DataFetcher, "fetch_data",
        staticmethod(lambda ticker, start, end: _synthetic_data()),
    )
    resp = client.post("/api/v1/optimize", json={
        "ticker": "BTC-USD", "start_date": "2022-01-01", "end_date": "2023-01-01",
        "strategy": "sma_crossover",
        "param_ranges": {"sma_fast": [10, 20], "sma_slow": [40, 50]},
    })
    assert resp.status_code == 200
    results = resp.json()["top_results"]
    assert len(results) == 4
    sharpes = [r["sharpe_ratio"] for r in results]
    assert sharpes == sorted(sharpes, reverse=True)
