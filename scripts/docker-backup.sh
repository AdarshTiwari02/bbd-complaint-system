#!/bin/bash

# Database Backup Script
# Backs up PostgreSQL database to a timestamped file

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "📦 Creating database backup..."
docker-compose exec -T postgres pg_dump -U bbd_user bbd_complaints > "$BACKUP_FILE"

echo "✅ Backup created: $BACKUP_FILE"
echo "📊 Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"

