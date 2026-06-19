#!/usr/bin/env bash
set -euo pipefail
set -x

docker-compose run --rm oak_fe npm test
docker-compose run --rm oak_fe npm run lint
