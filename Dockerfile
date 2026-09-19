# UNVALIDATED — no Docker daemon available in the dev sandbox this was written in.
# Adapted from MASTER_PROMPT_FINTECH_PLATFORM.md's Dockerfile example to this repo's actual
# flat layout (main.py + app/ + backtesting_engine.py at the repo root, not backend/).
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py backtesting_engine.py ./
COPY app/ ./app/

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
