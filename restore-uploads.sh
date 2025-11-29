#!/bin/bash

# Restore script for uploaded images
# This script restores uploaded images to the Docker volume from a backup

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 uploads_backup_20251128_021139.tar.gz"
    echo ""
    echo "Available backups:"
    ls -la /home/well_technologies_usa/remix-landing-eclectiquebykmc/uploads_backup/uploads_backup_*.tar.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"
BACKUP_DIR="/home/well_technologies_usa/remix-landing-eclectiquebykmc/uploads_backup"
FULL_BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

if [ ! -f "$FULL_BACKUP_PATH" ]; then
    echo "❌ Backup file not found: $FULL_BACKUP_PATH"
    exit 1
fi

echo "Starting restore from: $BACKUP_FILE"

# Restore from compressed backup to the Docker volume
docker run --rm \
  -v remix-uploads-volume:/data \
  -v "$BACKUP_DIR":/backup \
  alpine sh -c "cd /data && rm -rf * && tar -xzf /backup/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Restore completed successfully"
    echo "📁 Restored files:"
    docker run --rm -v remix-uploads-volume:/data alpine ls -la /data
else
    echo "❌ Restore failed"
    exit 1
fi