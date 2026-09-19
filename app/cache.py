import io

import pandas as pd
import redis

from app.config import REDIS_URL

# Real Redis cache per MASTER_PROMPT_FINTECH_PLATFORM.md's DataService, replacing the
# earlier in-process lru_cache shim (that one didn't survive a restart or share state
# across multiple backend workers; this one does).
_client = redis.from_url(REDIS_URL, decode_responses=True)

PRICE_DATA_TTL_SECONDS = 86400  # 24 hours, per BACKEND_ARCHITECTURE.md's caching strategy


def fetch_cached(ticker: str, start_date: str, end_date: str, fetch_fn) -> pd.DataFrame:
    """Redis-backed cache in front of fetch_fn(ticker, start_date, end_date)."""
    cache_key = f"market_data:{ticker}:{start_date}:{end_date}"

    cached = _client.get(cache_key)
    if cached is not None:
        return pd.read_json(io.StringIO(cached), convert_dates=['date'])

    data = fetch_fn(ticker, start_date, end_date)
    _client.setex(
        cache_key, PRICE_DATA_TTL_SECONDS,
        data.to_json(date_format='iso', double_precision=15),
    )
    return data


def clear_cache() -> None:
    _client.flushdb()
