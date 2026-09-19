import os

# Local, user-owned Postgres instance (no sudo/system service available in this environment).
DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://fintech@127.0.0.1:5544/fintech_db"
)
REDIS_URL = os.environ.get("REDIS_URL", "redis://127.0.0.1:6399/0")

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24
