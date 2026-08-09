# Dev Workflow

How to run the front-end locally, build it for production, run its tests/lint, and how its Docker images and the Tent proxy dev-mode flip work.

## Running Locally

```bash
# Start everything (proxy + Rails + Vite dev server)
docker-compose up

# Front-end only
docker-compose up oak_fe
```

The Vite dev server runs on port 8080 inside the container, exposed at `http://localhost:3020`. When `FRONTEND_DEV_MODE=true` in `.env`, the tent proxy (port 3000) forwards all front-end requests to it with HMR enabled.

---

## Building for Production

```bash
docker-compose exec oak_fe npm run build
```

Output lands in `docker_volumes/static/`, which tent mounts and serves directly.

---

## Tests and Lint

```bash
# Tests (Jasmine)
docker-compose exec oak_fe npm test

# Lint (ESLint)
docker-compose exec oak_fe npm run lint

# Lint with auto-fix
docker-compose exec oak_fe npm run lint_fix
```

---

## Docker Setup

Two images are used (see `dockerfiles/`):

| Image | Purpose |
|-------|---------|
| `vite_oak-base` | Published base image. Installs system deps, yarn cache, `deploy_frontend.sh`. Used in CI for builds. Default CMD: `npm run server`. |
| `vite_oak` | Local dev image. Pre-warms yarn cache at build time so `docker-compose up` starts fast. |

The `oak_fe` container mounts:

- `./frontend` → source code (watched by Vite for HMR)
- `./docker_volumes/node_modules` → persisted node_modules cache
- `./docker_volumes/static` → Vite build output, shared with `oak_proxy`

---

## Proxy Modes

Controlled by `FRONTEND_DEV_MODE` in `.env`:

| Mode | Behaviour |
|------|-----------|
| `FRONTEND_DEV_MODE=true` | Tent proxies `GET /`, `/assets/js/`, `/assets/css/`, `/assets/images/`, `/@vite/`, `/node_modules/`, and `/@react-refresh` to `http://frontend:8080` (Vite dev server with HMR). |
| `FRONTEND_DEV_MODE=false` | Tent serves static files from `/var/www/html/static`; `GET /` is rewritten to `/index.html`. |
