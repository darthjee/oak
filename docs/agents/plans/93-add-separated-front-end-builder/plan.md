# Plan: Add Separated Front-End Builder

Sub-issue of #92 — Use React Front-End.

## Overview

Establish the complete front-end infrastructure: React + Vite scaffold in `frontend/`, dedicated Docker images, docker-compose wiring, tent proxy rules, CircleCI jobs, and a documentation file. The only visible output at this stage is a placeholder `/` page. All subsequent resource pages (#94, #95, …) build on top of this foundation.

Reference implementation: `../weave` (same stack, already in production).

## Phases

| File | Scope |
|------|-------|
| [plan_frontend_scaffold.md](plan_frontend_scaffold.md) | Step 1 — `frontend/` folder: package.json, vite, eslint, jasmine, entry point |
| [plan_docker.md](plan_docker.md) | Steps 2–4 — `proxy/static/`, Dockerfiles, docker-compose |
| [plan_proxy.md](plan_proxy.md) | Step 5 — tent proxy configuration |
| [plan_ci.md](plan_ci.md) | Step 6 — CircleCI jobs |

## Step 7 — Write `docs/agents/frontend.md`

Create a documentation file covering:

- Folder structure of `frontend/`
- How to start the dev server locally (`docker-compose up oak_fe`)
- How `FRONTEND_DEV_MODE` controls proxy behaviour (dev proxies to Vite; non-dev serves `static/`)
- How to run tests (`npm test`) and lint (`npm run lint`)
- How to build for production (`vite build` → output to `docker_volumes/static/`)
- The two-Dockerfile pattern and why it exists (`vite_oak-base` vs `vite_oak`)

## Files Changed (summary)

| File | Change |
|------|--------|
| `frontend/` | New — React + Vite scaffold with placeholder page |
| `proxy/static/` | New — static assets dir for tent |
| `dockerfiles/vite_oak-base/Dockerfile` | New — base image (to be published) |
| `dockerfiles/vite_oak/Dockerfile` | New — dev image for docker-compose |
| `docker-compose.yml` | Add `oak_fe`; update `oak_proxy` |
| `docker_volumes/static/.keep` | New — track empty volume dir |
| `docker_volumes/node_modules/.keep` | New — track empty volume dir |
| `docker_volumes/proxy_configuration/configure.php` | Add `frontend.php` include |
| `docker_volumes/proxy_configuration/rules/frontend.php` | New — tent frontend rules |
| `docker_volumes/proxy_configuration/rules/backend.php` | Narrow to JSON API only |
| `.circleci/config.yml` | Add `jasmine` and `frontend-checks` jobs |
| `docs/agents/frontend.md` | New — front-end setup documentation |

## CI Checks

- `frontend/`: `yarn install && npm run lint` (CircleCI: `frontend-checks`) and `npm test` (CircleCI: `jasmine`)
- No Rails changes in this issue — no need to run RSpec or RuboCop.

## Notes

- This issue delivers only a placeholder page. No real React pages yet.
- `FRONTEND_DEV_MODE=true` must be added to `.env.example` (and `.env` locally).
- `docker_volumes/static/` is shared: `oak_fe` writes Vite output there, `oak_proxy` reads it.
- Until `darthjee/vite_oak-base` is published, use `darthjee/vite_weave-base:0.0.4` as stand-in.
