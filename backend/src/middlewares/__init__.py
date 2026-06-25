from fastapi import FastAPI

from src.middlewares import request_id


def init_app(app: FastAPI) -> None:
    register_middleware = app.middleware("http")
    register_middleware(request_id.middleware)
