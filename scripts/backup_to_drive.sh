#!/usr/bin/env bash
set -euo pipefail

# Create a timestamped archive of the current HEAD
ARCHIVE="/tmp/aigestion_$(date +%Y%m%d_%H%M%S).tar.gz"
git archive --format=tar.gz HEAD > "$ARCHIVE"

# Upload to Google Drive using gdrive CLI (requires prior authentication)
# The target folder ID should be stored in an env var DRIVE_BACKUP_FOLDER_ID
if [[ -z "${DRIVE_BACKUP_FOLDER_ID:-}" ]]; then
  echo "Error: DRIVE_BACKUP_FOLDER_ID not set"
  exit 1
fi

gdrive upload --parent "$DRIVE_BACKUP_FOLDER_ID" "$ARCHIVE"

# Optional integrity check: download and extract, then run tests
TEMP_DIR="/tmp/aigestion_restore_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$TEMP_DIR"
# Get the file ID of the uploaded archive (last uploaded)
FILE_ID=$(gdrive list --query "name='$(basename "$ARCHIVE")'" --no-header | awk '{print $1}')
if [[ -z "$FILE_ID" ]]; then
  echo "Error: Unable to locate uploaded file in Drive"
  exit 1
fi

gdrive download "$FILE_ID" --path "$TEMP_DIR"

tar -xzf "$TEMP_DIR/$(basename "$ARCHIVE")" -C "$TEMP_DIR"
cd "$TEMP_DIR/aigestion" || exit 1
pnpm install
pnpm -r test

# Clean up
rm -rf "$ARCHIVE" "$TEMP_DIR"
