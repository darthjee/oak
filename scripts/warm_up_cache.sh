#!/bin/bash
set -e

usage() {
  cat <<EOF
Usage: OAK_PRODUCTION_URL=<url> $(basename "$0") [options]

Runs the Navi cache warm-up against the production proxy using Docker.

Environment variables:
  OAK_PRODUCTION_URL  (required) Full base URL of the production app.
                      Example: https://oak.example.com

Options:
  --port <port>       Host port mapped to the Navi web UI (default: 5000).
                      The UI is available at http://localhost:<port> while running.
  -h, --help          Show this help message.

The warm-up pre-populates the proxy cache for all public resources
(home, categories, items, kinds) immediately after a release.
EOF
  exit 0
}

PORT=5000

while [ $# -gt 0 ]; do
  case "$1" in
    --help|-h)
      usage
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run '$(basename "$0") --help' for usage."
      exit 1
      ;;
  esac
done

if [ -z "$OAK_PRODUCTION_URL" ]; then
  echo "Error: OAK_PRODUCTION_URL is not set"
  echo "Run '$(basename "$0") --help' for usage."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

docker run --rm \
  -p "$PORT:3000" \
  -e OAK_PRODUCTION_URL="$OAK_PRODUCTION_URL" \
  -v "$PROJECT_ROOT/.circleci:/home/node/app/.circleci" \
  darthjee/navi-hey:latest \
  navi-hey --config .circleci/navi_config.yaml
