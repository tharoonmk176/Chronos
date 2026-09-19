import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


@pytest.fixture(autouse=True)
def _flush_redis_cache():
    """Real Redis now backs the price-data cache (app/cache.py). Without this, tests that
    reuse the same ticker+date-range cache key with different monkeypatched data would read
    back whatever an earlier test cached — silent cross-test contamination."""
    from app.cache import clear_cache
    clear_cache()
    yield
