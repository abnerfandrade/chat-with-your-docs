VENV = venv
PIP = $(VENV)/bin/pip
UVICORN = $(VENV)/bin/uvicorn
PYTEST = $(VENV)/bin/pytest
ALEMBIC = $(VENV)/bin/alembic

.PHONY: install install-dev dev infra-up infra-down up down logs tests migrate migrate-docker

install:
	$(PIP) install -r requirements.txt

install-dev:
	$(PIP) install -r requirements-dev.txt

dev:
	$(UVICORN) --factory src.main:create_app --host 0.0.0.0 --port 8000 --reload

infra-up:
	docker compose up postgres qdrant -d

infra-down:
	docker compose down

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs api -f

tests:
	$(PYTEST) -vvl tests

migrate:
	PYTHONPATH=. $(ALEMBIC) upgrade head

migrate-docker:
	docker compose exec api bash -c "PYTHONPATH=. alembic upgrade head"
