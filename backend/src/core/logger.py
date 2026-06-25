import logging
import sys

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


def context_patcher(record):
    record["extra"]["request_id"] = get_request_id() or "-"
    record["extra"]["duration_ms"] = record.get("extra", {}).get("duration_ms", 0)


def setup_logger():
    logger.remove()
    logger.configure(patcher=context_patcher)

    if settings.ENVIRONMENT == "production":
        logger.add(
            sys.stdout,
            serialize=True,
            level=settings.LOG_LEVEL,
            enqueue=True,
        )
    else:
        logger.add(
            sys.stdout,
            colorize=True,
            level=settings.LOG_LEVEL,
            format=(
                "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
                "<level>{level: <8}</level> | "
                "<cyan>{extra[request_id]}</cyan> | "
                "<cyan>{extra[duration_ms]}ms</cyan> | "
                "<level>{name}:{function}:{line} - {message}</level>"
            ),
        )

    logging.basicConfig(handlers=[InterceptHandler()], level=logging.WARNING)
    logging.getLogger("src").setLevel(settings.LOG_LEVEL)

    for logger_name in ["uvicorn", "uvicorn.error", "fastapi"]:
        mod_logger = logging.getLogger(logger_name)
        mod_logger.handlers = [InterceptHandler()]
        mod_logger.propagate = False

    logging.getLogger("uvicorn.access").handlers = []
    logging.getLogger("uvicorn.access").propagate = False


__all__ = ["logger", "setup_logger"]
