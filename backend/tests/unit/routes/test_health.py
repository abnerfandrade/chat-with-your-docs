import pytest


@pytest.mark.asyncio
async def test_health_returns_ok(async_client):
    response = await async_client.get("/health/")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_health_includes_request_headers(async_client):
    response = await async_client.get("/health/", headers={"X-Request-ID": "test-request-id"})

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "test-request-id"
    assert "X-Duration-Ms" in response.headers


@pytest.mark.asyncio
async def test_health_includes_cors_header_for_allowed_origin(async_client):
    response = await async_client.get(
        "/health/",
        headers={"Origin": "http://localhost:5173"},
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


@pytest.mark.asyncio
async def test_health_handles_cors_preflight(async_client):
    response = await async_client.options(
        "/health/",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "GET" in response.headers["access-control-allow-methods"]
