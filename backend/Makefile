.DEFAULT_GOAL := help

VENV = venv
PYTHON = $(VENV)/bin/python
PIP = $(VENV)/bin/pip
UVICORN = $(VENV)/bin/uvicorn
PYTEST = $(VENV)/bin/pytest
ALEMBIC = $(VENV)/bin/alembic

.PHONY: help install install-dev dev test test-unit test-answer-agent test-routes migrate revision

help:
	@printf "%s\n" \
		"Available targets:" \
		"  install            Install runtime dependencies" \
		"  install-dev        Install runtime and development dependencies" \
		"  dev                Run the FastAPI app with reload" \
		"  test               Run all backend tests" \
		"  test-unit          Run backend unit tests only" \
		"  test-answer-agent  Run answer-agent unit tests only" \
		"  test-routes        Run route unit tests only" \
		"  migrate            Apply alembic migrations locally" \
		"  revision           Create an alembic revision with message='<msg>'"

install:
	$(PIP) install -r requirements.txt

install-dev:
	$(PIP) install -r requirements-dev.txt

dev:
	$(UVICORN) --factory src.main:create_app --host 0.0.0.0 --port 8000 --reload

test:
	PYTHONPATH=. $(PYTEST) -vvl tests

test-unit:
	PYTHONPATH=. $(PYTEST) -vvl tests/unit

test-answer-agent:
	PYTHONPATH=. $(PYTEST) -vvl tests/unit/agents/answer_agent

test-routes:
	PYTHONPATH=. $(PYTEST) -vvl tests/unit/routes

migrate:
	PYTHONPATH=. $(ALEMBIC) upgrade head

revision:
	PYTHONPATH=. $(ALEMBIC) revision --autogenerate -m "$(message)"
