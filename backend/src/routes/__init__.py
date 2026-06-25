from fastapi import FastAPI

from src.routes import chat, documents, health


def init_app(app: FastAPI) -> None:
    chat.init_app(app)
    documents.init_app(app)
    health.init_app(app)
