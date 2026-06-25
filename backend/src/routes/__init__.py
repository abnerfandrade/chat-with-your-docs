from fastapi import FastAPI

from src.routes import documents, health


def init_app(app: FastAPI) -> None:
    documents.init_app(app)
    health.init_app(app)
