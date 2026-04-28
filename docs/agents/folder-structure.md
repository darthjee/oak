# Folder Structure

## Project Root

| Directory / File | Description |
|-----------------|-------------|
| `source/` | Main Rails application source code. |
| `dockerfiles/` | Dockerfiles for each service image (development, production, CI). |
| `docker_volumes/` | Persistent Docker volume mount points (database data, proxy cache/config). |
| `dev_public_files/` | Public static assets (images, photos, snaps) mounted into the app container during development. |
| `prod_public_files/` | Public static assets for production, including favicons and a conversion script. |
| `tests_public_files/` | Public static assets mounted during test runs. |
| `scripts/` | Utility and deployment shell scripts (`deploy.sh`, `prod_shell.sh`, `render.sh`). |
| `docs/` | Project documentation, including agent instructions and architecture notes. |
| `docker-compose.yml` | Docker Compose orchestration for all services. |
| `Makefile` | Developer workflow shortcuts (`make setup`, `make dev`, `make tests`, etc.). |
| `README.md` | Project overview and development setup instructions. |

## `source/`

| Subdirectory | Description |
|--------------|-------------|
| `app/` | Rails application code: models, controllers, views, decorators, builders, and jobs. |
| `config/` | Rails configuration (routes, environments, initializers). |
| `db/` | Database migrations, schema, and seeds. |
| `lib/` | Custom library modules not part of the core app. |
| `spec/` | RSpec test suite. |
| `bin/` | Rails binstubs and server/sidekiq startup scripts. |
| `public/` | Compiled and static public assets served directly. |

## `dockerfiles/`

| Subdirectory | Description |
|--------------|-------------|
| `oak/` | Development app image. |
| `oak-base/` | Base image shared by development images. |
| `production_oak/` | Production app image. |
| `production_oak-base/` | Base image shared by production images. |
| `circleci_oak-base/` | Base image used by CircleCI for CI runs. |

## `docker_volumes/`

| Subdirectory | Description |
|--------------|-------------|
| `mysql_data/` | Persistent MySQL data directory. |
| `proxy_cache/` | Cache storage for the darthjee/tent proxy. |
| `proxy_configuration/` | Configuration files for the darthjee/tent proxy. |
