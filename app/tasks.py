from app.celery_app import celery_app
from app.schemas import BacktestRequest
from app.service import execute_backtest


@celery_app.task(name="run_backtest_task")
def run_backtest_task(backtest_id: str, request_dict: dict) -> str:
    execute_backtest(backtest_id, BacktestRequest(**request_dict))
    return backtest_id
