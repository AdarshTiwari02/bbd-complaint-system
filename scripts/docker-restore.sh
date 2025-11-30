#!/bin/bash

# Database Restore Script
# Restores PostgreSQL database from a backup file

set -e

if [ -z "$1" ]; then
    echo "❌ Usage: $0 <backup-file.sql>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will overwrite the current database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 1
fi

echo "🔄 Restoring database from $BACKUP_FILE..."
docker-compose exec -T postgres psql -U bbd_user -d bbd_complaints < "$BACKUP_FILE"

echo "✅ Database restored successfully!"



