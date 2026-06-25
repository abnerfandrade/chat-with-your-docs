import time
import uuid
from http import HTTPStatus
from typing import Awaitable, Callable

from fastapi import Request
from starlette.responses import Response

from src.core.contexts import set_request_id
from src.core.logger import logger


async def middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    set_request_id(request_id)
    start_time = time.time()

    client_host = request.client.host if request.client else "unknown"
    client_port = request.client.port if request.client else 0

    try:
        response = await call_next(request)
        duration_ms = (time.time() - start_time) * 1000

        try:
            status_phrase = HTTPStatus(response.status_code).phrase
        except ValueError:
            status_phrase = ""

        logger.bind(
            event="http_request",
            http_method=request.method,
            http_path=request.url.path,
            http_status_code=response.status_code,
            http_url=str(request.url),
            network_client_ip=client_host,
            network_client_port=client_port,
            duration_ms=round(duration_ms, 2),
        ).info(
            f'{client_host}:{client_port} - "{request.method} {request.url.path}" '
            f"{response.status_code} {status_phrase}"
        )

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Duration-Ms"] = str(round(int(duration_ms)))

        return response

    except Exception as exc:
        duration_ms = (time.time() - start_time) * 1000

        logger.bind(
            event="http_request_error",
            http_method=request.method,
            http_path=request.url.path,
            network_client_ip=client_host,
            duration_ms=round(duration_ms, 2),
            error=str(exc),
        ).error("Request failed")
        raise
