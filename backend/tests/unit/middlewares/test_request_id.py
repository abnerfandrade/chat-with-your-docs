from unittest.mock import AsyncMock

import pytest
from starlette.requests import Request
from starlette.responses import Response

from src.core.contexts import get_request_id, reset_request_id, set_request_id
from src.middlewares.request_id import middleware


def make_request(
    method: str = "GET",
    path: str = "/health/",
    headers: dict[str, str] | None = None,
    client: tuple[str, int] = ("127.0.0.1", 1234),
) -> Request:
    raw_headers = [
        (key.lower().encode("latin-1"), value.encode("latin-1"))
        for key, value in (headers or {}).items()
    ]
    scope = {
        "type": "http",
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": path,
        "raw_path": path.encode("ascii"),
        "query_string": b"",
        "headers": raw_headers,
        "client": client,
        "server": ("testserver", 80),
    }
    return Request(scope)


@pytest.mark.asyncio
async def test_middleware_sets_headers_logs_request_and_restores_context(mocker):
    request = make_request(headers={"X-Request-ID": "req-123"})
    response = Response(status_code=200)
    call_next = AsyncMock(return_value=response)
    bound_logger = mocker.Mock()
    mocker.patch("src.middlewares.request_id.logger.bind", return_value=bound_logger)
    outer_token = set_request_id("outer-request")

    try:
        result = await middleware(request, call_next)

        assert result.headers["X-Request-ID"] == "req-123"
        assert "X-Duration-Ms" in result.headers
        assert get_request_id() == "outer-request"

        bound_logger.info.assert_called_once()
        bound_logger.warning.assert_not_called()
    finally:
        reset_request_id(outer_token)


@pytest.mark.asyncio
async def test_middleware_uses_warning_for_server_errors(mocker):
    request = make_request(headers={"X-Request-ID": "req-500"})
    response = Response(status_code=503)
    call_next = AsyncMock(return_value=response)
    bound_logger = mocker.Mock()
    mocker.patch("src.middlewares.request_id.logger.bind", return_value=bound_logger)

    result = await middleware(request, call_next)

    assert result.headers["X-Request-ID"] == "req-500"
    bound_logger.warning.assert_called_once()
    bound_logger.info.assert_not_called()


@pytest.mark.asyncio
async def test_middleware_skips_access_log_for_options_requests(mocker):
    request = make_request(method="OPTIONS", headers={"X-Request-ID": "req-options"})
    response = Response(status_code=200)
    call_next = AsyncMock(return_value=response)
    bind_mock = mocker.patch("src.middlewares.request_id.logger.bind")

    result = await middleware(request, call_next)

    assert result.headers["X-Request-ID"] == "req-options"
    assert "X-Duration-Ms" in result.headers
    bind_mock.assert_not_called()


@pytest.mark.asyncio
async def test_middleware_logs_exception_and_restores_context(mocker):
    request = make_request(headers={"X-Request-ID": "req-error"})
    call_next = AsyncMock(side_effect=RuntimeError("boom"))
    opt_logger = mocker.Mock()
    bound_logger = mocker.Mock()
    opt_logger.bind.return_value = bound_logger
    opt_mock = mocker.patch("src.middlewares.request_id.logger.opt", return_value=opt_logger)
    outer_token = set_request_id("outer-request")

    try:
        with pytest.raises(RuntimeError, match="boom"):
            await middleware(request, call_next)

        assert get_request_id() == "outer-request"
        opt_mock.assert_called_once_with(exception=True)
        opt_logger.bind.assert_called_once()
        bound_logger.error.assert_called_once_with("Request failed")
    finally:
        reset_request_id(outer_token)
