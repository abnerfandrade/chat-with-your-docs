import json
import logging
import sys
import warnings
from datetime import timezone

from loguru import logger

from src.core.config import settings
from src.core.contexts import get_request_id


class InterceptHandler(logging.Handler):
    def emit(self, record):
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = logging.currentframe(), 2
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


def json_sink(message) -> None:
    record = message.record
    payload = {
        "timestamp": record["time"].astimezone(timezone.utc).isoformat(),
        "level": record["level"].name,
        "logger": record["name"],
        "function": record["function"],
        "line": record["line"],
        "message": record["message"],
        **record["extra"],
    }

    if record["exception"] is not None:
        payload["exception"] = str(record["exception"])

    sys.stderr.write(json.dumps(payload, default=str) + "\n")


def context_patcher(record) -> None:
    extra = record["extra"]
    extra.setdefault("environment", settings.ENVIRONMENT)
    extra["request_id"] = get_request_id() or extra.get("request_id") or "-"
    extra.setdefault("duration_ms", 0)


def setup_logger() -> None:
    logger.remove()
    logger.configure(patcher=context_patcher)

    if settings.ENVIRONMENT == "production":
        logger.add(
            json_sink,
            level=settings.LOG_LEVEL,
            enqueue=True,
            backtrace=False,
            diagnose=False,
        )
    else:
        logger.add(
            sys.stderr,
            colorize=True,
            level=settings.LOG_LEVEL,
            format=(
                "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
                "<level>{level: <8}</level> | "
                "<cyan>{extra[duration_ms]}ms</cyan> | "
                "<cyan>{extra[request_id]}</cyan> | "
                "<level>{name}:{function}:{line} - {message}</level>"
            ),
            enqueue=True,
            backtrace=False,
            diagnose=False,
        )

    logging.basicConfig(handlers=[InterceptHandler()], level=logging.WARNING, force=True)
    logging.getLogger("src").setLevel(settings.LOG_LEVEL)

    warnings.filterwarnings(
        "ignore",
        message="Pydantic serializer warnings\\.",
        category=UserWarning,
    )
    warnings.filterwarnings(
        "ignore",
        message="Expected `none` but got .*",
        category=UserWarning,
    )

    for logger_name in ["uvicorn", "uvicorn.error", "fastapi"]:
        mod_logger = logging.getLogger(logger_name)
        mod_logger.handlers = [InterceptHandler()]
        mod_logger.propagate = False

    logging.getLogger("uvicorn.access").handlers = []
    logging.getLogger("uvicorn.access").propagate = False
    logging.getLogger("pdfminer").setLevel(logging.ERROR)


__all__ = ["logger", "setup_logger"]
