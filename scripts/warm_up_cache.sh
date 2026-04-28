#!/bin/bash
set -e

usage() {
  cat <<EOF
Usage: OAK_PRODUCTION_URL=<url> $(basename "$0")

Runs the Navi cache warm-up against the production proxy using Docker.

Environment variables:
  OAK_PRODUCTION_URL  (required) Full base URL of the production app.
                      Example: https://oak.example.com

The warm-up pre-populates the proxy cache for all public resources
(home, categories, items, kinds) immediately after a release.
The Navi web UI is available at http://localhost:5000 while running.
EOF
  exit 0
}

if [ "${1}" = "--help" ] || [ "${1}" = "-h" ]; then
  usage
fi

if [ -z "$OAK_PRODUCTION_URL" ]; then
  echo "Error: OAK_PRODUCTION_URL is not set"
  echo "Run '$(basename "$0") --help' for usage."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

docker run --rm \
  -p 5000:3000 \
  -e OAK_PRODUCTION_URL="$OAK_PRODUCTION_URL" \
  -v "$PROJECT_ROOT/.circleci:/home/node/app/.circleci" \
  darthjee/navi-hey:latest \
  navi-hey --config .circleci/navi_config.yaml
