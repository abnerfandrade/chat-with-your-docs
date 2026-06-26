.DEFAULT_GOAL := help

COMPOSE = docker compose

.PHONY: help run-all run-infra run-api run-frontend stop down logs logs-api logs-frontend logs-db

help:
	@printf "%s\n" \
		"Available targets:" \
		"  run-all        Build and start postgres, qdrant, api, and frontend" \
		"  run-infra      Start postgres and qdrant only" \
		"  run-api        Build and start the api service with its dependencies" \
		"  run-frontend   Build and start the frontend service" \
		"  stop           Stop all compose services" \
		"  down           Stop and remove all compose services" \
		"  logs           Tail all compose logs" \
		"  logs-api       Tail api logs" \
		"  logs-frontend  Tail frontend logs" \
		"  logs-db        Tail postgres logs"

run-all:
	$(COMPOSE) up -d --build

run-infra:
	$(COMPOSE) up -d postgres qdrant

run-api:
	$(COMPOSE) up -d --build api

run-frontend:
	$(COMPOSE) up -d --build frontend

stop:
	$(COMPOSE) stop

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

logs-api:
	$(COMPOSE) logs -f api

logs-frontend:
	$(COMPOSE) logs -f frontend

logs-db:
	$(COMPOSE) logs -f postgres
