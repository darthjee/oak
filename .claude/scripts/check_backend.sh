#!/usr/bin/env bash
set -euo pipefail
set -x

docker-compose exec oak_app bundle exec rspec
docker-compose exec oak_app bundle exec rubocop
