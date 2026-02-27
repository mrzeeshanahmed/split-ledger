#!/bin/bash
# scripts/backup.sh
# Purpose: Dump all Postgres schemas to a file and upload to AWS S3.
# Usage: Run via cron on the host machine or inside a backup container.
# Variables required:
#   DB_HOST, DB_USER, DB_PASSWORD
#   S3_BUCKET (e.g., s3://my-backup-bucket)
#   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

set -e

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/tmp/pg_backups"
BACKUP_FILE="splitledger_full_backup_$TIMESTAMP.sql.gz"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

# Ensure temp directory exists
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup of PostgreSQL cluster..."

# Create .pgpass file for passwordless pg_dumpall
# Format: hostname:port:database:username:password
echo "$DB_HOST:5432:*:$DB_USER:$DB_PASSWORD" > ~/.pgpass
chmod 600 ~/.pgpass

# Perform a full pg_dumpall
# This guarantees public tables, roles, and all dynamically created tenant schemas are preserved!
pg_dumpall -h "$DB_HOST" -U "$DB_USER" | gzip > "$BACKUP_PATH"

echo "[$(date)] Backup completed locally at $BACKUP_PATH. Size: $(du -sh $BACKUP_PATH)"

if [ -n "$S3_BUCKET" ]; then
  echo "[$(date)] Uploading to S3 bucket $S3_BUCKET..."
  aws s3 cp "$BACKUP_PATH" "$S3_BUCKET/$BACKUP_FILE"
  echo "[$(date)] Upload successful."
else
  echo "[$(date)] S3_BUCKET not set. Skipping upload."
fi

# Cleanup local backup and pgpass
rm -f "$BACKUP_PATH"
rm -f ~/.pgpass

echo "[$(date)] Backup process completed successfully."
