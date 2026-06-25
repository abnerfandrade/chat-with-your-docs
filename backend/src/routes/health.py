from fastapi import APIRouter, FastAPI

router = APIRouter(prefix="/health", tags=["health"])


def init_app(app: FastAPI) -> None:
    app.include_router(router)


@router.get("/")
async def health():
    return {"status": "ok"}
