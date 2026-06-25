import json
import logging
import sys
from datetime import datetime, timezone
from types import SimpleNamespace

from src.core.config import settings
from src.core.contexts import reset_request_id, set_request_id
from src.core.logger import context_patcher, json_sink, setup_logger


def test_context_patcher_adds_request_context_and_defaults():
    token = set_request_id("req-123")

    try:
        record = {"extra": {}}

        context_patcher(record)

        assert record["extra"]["request_id"] == "req-123"
        assert record["extra"]["environment"] == settings.ENVIRONMENT
        assert record["extra"]["duration_ms"] == 0
    finally:
        reset_request_id(token)


def test_context_patcher_preserves_existing_duration():
    token = set_request_id("req-456")

    try:
        record = {"extra": {"duration_ms": 12.5}}

        context_patcher(record)

        assert record["extra"]["duration_ms"] == 12.5
    finally:
        reset_request_id(token)


def test_json_sink_writes_flat_json(monkeypatch):
    write_calls: list[str] = []
    monkeypatch.setattr(sys.stderr, "write", write_calls.append)

    message = SimpleNamespace(
        record={
            "time": datetime(2026, 6, 25, 12, 0, tzinfo=timezone.utc),
            "level": SimpleNamespace(name="INFO"),
            "name": "src.middlewares.request_id",
            "function": "middleware",
            "line": 42,
            "message": "request completed",
            "extra": {
                "request_id": "req-789",
                "duration_ms": 8.3,
                "event": "http_request",
            },
            "exception": None,
        }
    )

    json_sink(message)

    assert len(write_calls) == 1
    payload = json.loads(write_calls[0])

    assert payload["timestamp"] == "2026-06-25T12:00:00+00:00"
    assert payload["level"] == "INFO"
    assert payload["logger"] == "src.middlewares.request_id"
    assert payload["function"] == "middleware"
    assert payload["line"] == 42
    assert payload["message"] == "request completed"
    assert payload["request_id"] == "req-789"
    assert payload["duration_ms"] == 8.3
    assert payload["event"] == "http_request"


def test_setup_logger_silences_uvicorn_access_and_pdfminer():
    setup_logger()

    assert logging.getLogger("uvicorn.access").propagate is False
    assert logging.getLogger("uvicorn.access").handlers == []
    assert logging.getLogger("pdfminer").level == logging.ERROR
