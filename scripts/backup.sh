#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
CONTAINER="vector-postgres"
DB_NAME="vector_db"
DB_USER="vector_user"
RETENTION_DAYS=30
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Load password from .env if not already set
if [ -z "${VECTOR_DB_PASSWORD:-}" ]; then
    ENV_FILE="$PROJECT_DIR/.env"
    if [ -f "$ENV_FILE" ]; then
        VECTOR_DB_PASSWORD="$(grep -E '^VECTOR_DB_PASSWORD=' "$ENV_FILE" | cut -d'=' -f2-)"
    fi
    if [ -z "${VECTOR_DB_PASSWORD:-}" ]; then
        echo "Error: VECTOR_DB_PASSWORD not set and not found in .env" >&2
        exit 1
    fi
fi

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Verify container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo "Error: Container $CONTAINER is not running" >&2
    exit 1
fi

# Run pg_dump and compress
echo "Backing up $DB_NAME from $CONTAINER..."
docker exec -e PGPASSWORD="$VECTOR_DB_PASSWORD" "$CONTAINER" \
    pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ ! -s "$BACKUP_FILE" ]; then
    echo "Error: Backup file is empty" >&2
    rm -f "$BACKUP_FILE"
    exit 1
fi

BACKUP_SIZE="$(du -h "$BACKUP_FILE" | cut -f1)"
echo "Backup saved: $BACKUP_FILE ($BACKUP_SIZE)"

# Delete backups older than retention period
DELETED=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "Deleted $DELETED backup(s) older than $RETENTION_DAYS days"
fi

echo "Backup complete"
