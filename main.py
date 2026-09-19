from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from app.api import router
from app.db import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Quantitative Multi-Asset Backtesting Platform",
    description="FastAPI backend per BACKEND_ARCHITECTURE.md",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
def root_health():
    return {"status": "healthy"}


@app.get("/metrics")
def metrics():
    """Prometheus scrape endpoint — process/GC metrics come from prometheus_client's default
    collectors for free; no custom instrumentation added since nothing here needs it yet."""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
