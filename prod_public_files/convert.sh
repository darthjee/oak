#!/bin/bash

convert_photos() {
  local SOURCE_DIR="$1"
  local DEST_DIR="$2"

  # Find all files in the source folder
  find "$SOURCE_DIR" -type f | while read -r file; do
    # Replace source directory with destination directory in the file path
    dest_file="${file/$SOURCE_DIR/$DEST_DIR}"

    # Check if the destination file already exists
    if [ ! -f "$dest_file" ]; then
      # Create the destination directory if it doesn't exist
      mkdir -p "$(dirname "$dest_file")"

      # Convert the file, resizing only if larger than 215x215
      convert "$file" -resize 215x215\> "$dest_file"

      echo "Converted: $file -> $dest_file"
    else
      echo "Skipped (already exists): $dest_file"
    fi
  done
}

# Base path for the source folder (photos)
SOURCE_DIR="./photos"

# Base path for the destination folder (snaps)
DEST_DIR="./snaps"

# Call the function with the source and destination directories
convert_photos "$SOURCE_DIR" "$DEST_DIR"

# Sync files to remote server
rsync -aP ./ dreamhost:photos.oak.ffavs.net/