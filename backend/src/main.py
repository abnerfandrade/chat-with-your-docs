from contextlib import asynccontextmanager

from fastapi import FastAPI

from src import middlewares, routes
from src.core.logger import setup_logger


@asynccontextmanager
async def lifespan(app: FastAPI):
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
