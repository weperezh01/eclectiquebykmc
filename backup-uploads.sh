#!/bin/bash

# Backup script for uploaded images
# This script creates a backup of uploaded images from the Docker volume

BACKUP_DIR="/home/well_technologies_usa/remix-landing-eclectiquebykmc/uploads_backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="uploads_backup_${TIMESTAMP}.tar.gz"

echo "Starting upload images backup..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create compressed backup from the Docker volume
docker run --rm \
  -v remix-uploads-volume:/data:ro \
  -v "$BACKUP_DIR":/backup \
  alpine tar -czf "/backup/$BACKUP_FILE" -C /data .

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully: $BACKUP_DIR/$BACKUP_FILE"
    
    # Keep only last 10 backups
    cd "$BACKUP_DIR"
    ls -t uploads_backup_*.tar.gz | tail -n +11 | xargs -r rm
    echo "📁 Cleaned old backups, keeping last 10"
else
    echo "❌ Backup failed"
    exit 1
fi