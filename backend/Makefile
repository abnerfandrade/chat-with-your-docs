.DEFAULT_GOAL := help

VENV = venv
PYTHON = $(VENV)/bin/python
PIP = $(VENV)/bin/pip
UVICORN = $(VENV)/bin/uvicorn
PYTEST = $(VENV)/bin/pytest
ALEMBIC = $(VENV)/bin/alembic
COMPOSE = docker compose

.PHONY: help install install-dev dev infra-up infra-down up down logs logs-api logs-db test test-unit test-answer-agent test-routes migrate revision migrate-docker

help:
	@printf "%s\n" \
		"Available targets:" \
		"  install            Install runtime dependencies" \
		"  install-dev        Install runtime and development dependencies" \
		"  dev                Run the FastAPI app with reload" \
		"  infra-up           Start postgres and qdrant only" \
		"  infra-down         Stop local infrastructure" \
		"  up                 Build and start the full docker stack" \
		"  down               Stop the full docker stack" \
		"  logs               Tail API logs from docker compose" \
		"  logs-db            Tail postgres logs from docker compose" \
		"  test               Run all backend tests" \
		"  test-unit          Run backend unit tests only" \
		"  test-answer-agent  Run answer-agent unit tests only" \
		"  test-routes        Run route unit tests only" \
		"  migrate            Apply alembic migrations locally" \
		"  revision           Create an alembic revision with message='<msg>'" \
		"  migrate-docker     Apply alembic migrations inside the api container"

install:
	$(PIP) install -r requirements.txt

install-dev:
	$(PIP) install -r requirements-dev.txt

dev:
	$(UVICORN) --factory src.main:create_app --host 0.0.0.0 --port 8000 --reload

infra-up:
	$(COMPOSE) up postgres qdrant -d

infra-down:
	$(COMPOSE) stop postgres qdrant

up:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

logs-api:
	$(COMPOSE) logs api -f

logs-db:
	$(COMPOSE) logs postgres -f

test:
	PYTHONPATH=. $(PYTEST) -vvl tests

migrate:
	PYTHONPATH=. $(ALEMBIC) upgrade head

migrate-docker:
	$(COMPOSE) exec api bash -c "PYTHONPATH=. alembic upgrade head"
