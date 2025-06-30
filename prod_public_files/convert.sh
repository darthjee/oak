#!/bin/bash

convert_photos() {
  local SOURCE_DIR="$1"
  local DEST_DIR="$2"
  local MAX_SIZE="$3"
  local FORCE="$4"

  # Find all files in the source folder
  find "$SOURCE_DIR" -type f | while read -r file; do
    # Replace source directory with destination directory in the file path
    dest_file="${file/$SOURCE_DIR/$DEST_DIR}"

    # Check if the destination file already exists
    if [ "$FORCE" == "true" ] || [ ! -f "$dest_file" ]; then
      # Create the destination directory if it doesn't exist
      mkdir -p "$(dirname "$dest_file")"

      # Convert the file, resizing only if larger than MAX_SIZE
      convert "$file" -resize "${MAX_SIZE}>" "$dest_file"

      echo "Converted: $file -> $dest_file"
    else
      echo "Skipped (already exists): $dest_file"
    fi
  done
}

# Generate photos
convert_photos "./origin" "./photos" "800x1064" "true"

# Generates snaps
convert_photos "./origin" "./snaps" "215x215" "true"

# Sync files to remote server
rsync -aP ./photos/ dreamhost:photos.oak.ffavs.net/photos/
rsync -aP ./snaps/ dreamhost:photos.oak.ffavs.net/snaps/