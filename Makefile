.PHONY: help build start stop restart logs health status deploy-standard rollback clean backup restore reindex

APP_NAME = vector-app
COMPOSE_FILE = docker-compose.yml

help:
	@echo "Vector App Management Commands:"
	@echo "  make build          - Build the Docker image"
	@echo "  make start          - Start the application"
	@echo "  make stop           - Stop the application"
	@echo "  make restart        - Restart the application"
	@echo "  make logs           - Show application logs"
	@echo "  make health         - Check application health"
	@echo "  make status         - Show container status"
	@echo "  make deploy         - Deploy the application"
	@echo "  make backup         - Backup PostgreSQL database"
	@echo "  make restore F=file - Restore PostgreSQL from backup"
	@echo "  make clean          - Clean up volumes and data"
	@echo "  make reindex        - Trigger content reindex"

build:
	docker-compose -f $(COMPOSE_FILE) build --no-cache

start:
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "Waiting for services to start..."
	@sleep 10
	@make health

stop:
	docker-compose -f $(COMPOSE_FILE) down

restart: stop start

logs:
	docker-compose -f $(COMPOSE_FILE) logs -f --tail=100

health:
	@echo "Checking application health..."
	@docker ps | grep $(APP_NAME) > /dev/null && echo "✓ Container is running" || echo "✗ Container is not running"
	@curl -s -o /dev/null -w "✓ Frontend responding: %{http_code}\n" https://vector.jdok.dev || echo "✗ Frontend not responding"
	@curl -s -o /dev/null -w "✓ API responding: %{http_code}\n" https://vector.jdok.dev/api/health || echo "✗ API not responding"

status:
	@docker ps --filter name=$(APP_NAME) --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

deploy:
	@mkdir -p ./data ./content ./logs
	docker-compose up -d --build
	@sleep 5
	@make health

clean:
	@echo "⚠️  Warning: This will delete all data!"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
	@sleep 5
	docker-compose -f $(COMPOSE_FILE) down -v
	rm -rf ./data ./content ./logs
	@echo "Cleanup complete!"

backup:
	@bash scripts/backup.sh

restore:
	@test -n "$(F)" || (echo "Usage: make restore F=backups/vector_db_YYYYMMDD_HHMMSS.sql.gz" && exit 1)
	@test -f "$(F)" || (echo "Error: File $(F) not found" && exit 1)
	@echo "Restoring from $(F)..."
	@gunzip -c "$(F)" | docker exec -i -e PGPASSWORD=$(VECTOR_DB_PASSWORD) vector-postgres psql -U vector_user vector_db
	@echo "Restore complete"

# Development helpers
shell:
	docker exec -it $(APP_NAME) /bin/sh

reindex:
	@docker exec $(APP_NAME) node -e "const http = require('http'); http.request({hostname:'localhost',port:3001,path:'/api/reindex',method:'POST'}, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>console.log(r.statusCode,d)); }).end();"

rebuild: stop build start

monitor:
	@watch -n 5 'docker ps --filter name=$(APP_NAME) --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" && echo && docker stats --no-stream $(APP_NAME)'