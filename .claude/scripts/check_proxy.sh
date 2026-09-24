#!/usr/bin/env bash
set -euo pipefail
set -x

docker compose run --rm extension_tests
