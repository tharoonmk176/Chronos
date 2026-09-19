from celery import Celery

from app.config import REDIS_URL

# Redis as the Celery broker/backend — MASTER_PROMPT_FINTECH_PLATFORM.md specifies RabbitMQ,
# but it isn't installable here without sudo. Celery officially supports Redis as a broker;
# this is a documented substitution, not an approximation.
celery_app = Celery("fintech_platform", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.imports = ("app.tasks",)
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
