from fastapi import FastAPI

from src.routes import health


def init_app(app: FastAPI) -> None:
    health.init_app(app)
