from fastapi import FastAPI


def create_app() -> FastAPI:
    return FastAPI(title="Chat With Your Docs API")
