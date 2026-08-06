#!/usr/bin/env bash
# Audit CircleCI docker-executor jobs for `working_directory` collisions
# with content their own Docker image already bakes in.
#
# Background: `upload_proxy_files` broke on a tagged release because
# `darthjee/tent:0.10.1` started pre-populating `/var/www/html`, which the
# job also used as its `working_directory` — `checkout` then failed
# because the directory wasn't empty (see issue #221). That coupling isn't
# visible anywhere in `.circleci/config.yml`; it only surfaces once the
# underlying image changes. This script re-runs that audit on demand.
#
# Only jobs that set an EXPLICIT `working_directory` are checked — jobs
# relying on CircleCI's implicit default (`~/project`) are out of scope,
# since none of this repo's images bake content there today.
#
# Usage: scripts/audit_working_dirs.sh [config_file]
# Requires: awk (to parse the jobs: section), docker (to inspect each image).
# Exits 0 when no collision is found, 1 otherwise.
#
# Parsing note: this deliberately avoids a YAML library (ruby/python
# dependencies aren't guaranteed on the host — this repo's own dev workflow
# runs everything through docker-compose) in favor of a small awk parser
# tailored to the flat `jobs: <name>: docker: [{image: ...}] working_directory: ...`
# shape used throughout `.circleci/config.yml`. If that shape changes
# significantly, revisit this parser.

set -euo pipefail

CONFIG_FILE="${1:-.circleci/config.yml}"

[[ -f "$CONFIG_FILE" ]] || { echo "Error: config file not found: $CONFIG_FILE" >&2; exit 1; }

jobs_tsv=$(awk '
  /^jobs:/ { in_jobs=1; next }
  in_jobs && /^[A-Za-z]/ { in_jobs=0 }
  in_jobs && /^  [A-Za-z0-9_-]+:[ ]*$/ {
    if (job != "" && image != "" && wd != "") print job "\t" image "\t" wd
    job=$0; sub(/^  /,"",job); sub(/:[ ]*$/,"",job)
    image=""; wd=""; next
  }
  in_jobs && image=="" && /^[ ]*-[ ]*image:/ {
    val=$0; sub(/^[ ]*-[ ]*image:[ ]*/,"",val); gsub(/^"|"$/,"",val); image=val
  }
  in_jobs && /^[ ]*working_directory:/ {
    val=$0; sub(/^[ ]*working_directory:[ ]*/,"",val); gsub(/^"|"$/,"",val); wd=val
  }
  END { if (job != "" && image != "" && wd != "") print job "\t" image "\t" wd }
' "$CONFIG_FILE")

if [[ -z "$jobs_tsv" ]]; then
  echo "No docker jobs with an explicit working_directory found — nothing to audit."
  exit 0
fi

collisions=0

while IFS=$'\t' read -r job image working_directory; do
  [[ -z "$job" ]] && continue

  echo "== ${job} (image: ${image}, working_directory: ${working_directory}) =="
  contents=$(docker run --rm "$image" sh -c "ls -A '${working_directory}' 2>/dev/null" || true)

  if [[ -n "$contents" ]]; then
    echo "  COLLISION: pre-existing content found in ${working_directory}:"
    echo "$contents" | sed 's/^/    /'
    collisions=$((collisions + 1))
  else
    echo "  OK: ${working_directory} is empty (or does not exist) in the image."
  fi
done <<< "$jobs_tsv"

echo
if [[ "$collisions" -gt 0 ]]; then
  echo "Found ${collisions} job(s) with a working_directory collision."
  exit 1
fi

echo "No working_directory collisions found."
