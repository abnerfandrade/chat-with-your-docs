import asyncio
import os
from contextlib import asynccontextmanager, contextmanager
from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import FastAPI

from src import middlewares, routes
from src.core.config import settings
from src.core.logger import logger, setup_logger

BACKEND_DIR = Path(__file__).resolve().parents[1]
ALEMBIC_SCRIPT_LOCATION = BACKEND_DIR / "alembic"


@contextmanager
def working_directory(path: Path):
    previous_directory = Path.cwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(previous_directory)


def run_migrations() -> None:
    alembic_config = Config()
    alembic_config.set_main_option(
        "script_location",
        str(ALEMBIC_SCRIPT_LOCATION),
    )
    alembic_config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    alembic_config.set_main_option("prepend_sys_path", str(BACKEND_DIR))

    migration_logger = logger.bind(service="startup")
    migration_logger.info("Running Alembic migrations")

    with working_directory(BACKEND_DIR):
        command.upgrade(alembic_config, "head")

    migration_logger.info("Alembic migrations completed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await asyncio.to_thread(run_migrations)
    yield


def create_app() -> FastAPI:
    setup_logger()

    app = FastAPI(
        title="Chat With Your Docs API",
        version="0.1.0",
        lifespan=lifespan,
    )

    middlewares.init_app(app)
    routes.init_app(app)

    return app
