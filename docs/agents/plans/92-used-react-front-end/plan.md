# Plan: Use React Front-End

## Overview

Extract the frontend from the Rails app into a standalone React + Vite application under `frontend/`. The tent proxy serves the React-built assets (or proxies to the Vite dev server in development) and forwards JSON API requests to Rails. The visual appearance and navigation must remain identical. This mirrors the pattern already in use in `../weave`.

## Context

Currently the Rails app serves both the AngularJS SPA (via ERB templates + `?ajax=true`) and the JSON API. Tent proxies all requests to Rails. After this migration, tent will route HTML/asset requests to the React frontend and only forward JSON API calls to Rails. Rails retains its full JSON API — no controller or model changes are needed for the initial migration.

The `../weave` project is the reference implementation: it has a `frontend/` React + Vite app, two Dockerfiles (`vite_weave-base` and `vite_weave`), a `proxy/` folder with static assets, and `docker_volumes/static/` where Vite outputs its built files.

---

## Implementation Steps

### Step 1 — Scaffold the React + Vite project

Create `frontend/` at the project root with a React + Vite setup, mirroring `../weave/frontend/`:

- `frontend/package.json` — React 19, react-dom, react-router-dom, bootstrap, react-bootstrap, @tanstack/react-query; dev: vite, @vitejs/plugin-react, eslint, jasmine, nyc
- `frontend/vite.config.js` — server on `0.0.0.0:8080`, React plugin with babel-plugin-react-compiler
- `frontend/index.html` — SPA entry point
- `frontend/assets/` — static assets (images, fonts)
- `frontend/spec/` — Jasmine unit tests
- `frontend/eslint.config.mjs` — ESLint config (matching weave)
- `frontend/yarn.lock` — lock file

### Step 2 — Create the `proxy/` folder

Create a `proxy/static/` directory for static assets served directly by tent (images, etc.), mirroring `../weave/proxy/static/`. This folder is mounted at `/var/www/html/static/` inside the proxy container. The Vite-built `index.html`, JS and CSS will overlay this from `docker_volumes/static/`.

### Step 3 — Add two Dockerfiles for the frontend

Following the weave two-image pattern:

**`dockerfiles/vite_oak-base/Dockerfile`** — base image to be published as `darthjee/vite_oak-base`:
- From `darthjee/node:0.2.1`
- Installs rsync
- Copies `frontend/package.json` and `frontend/yarn.lock`
- Copies `deploy_frontend.sh` from `darthjee/scripts`
- Pre-warms yarn cache via `yarn_builder.sh`
- Default `CMD ["npm", "run", "server"]`

**`dockerfiles/vite_oak/Dockerfile`** — dev image used in docker-compose:
- From `darthjee/vite_oak-base`
- Copies `frontend/package.json` and `frontend/yarn.lock`
- Pre-warms yarn cache (so `docker-compose build` pre-installs node_modules)

> Until `darthjee/vite_oak-base` is published to Docker Hub, CI can temporarily reference `darthjee/vite_weave-base:0.0.4` (already used in the existing `release` CI job).

### Step 4 — Add `oak_fe` service and update volumes in docker-compose

Update `docker-compose.yml`:

**Add `oak_fe` service:**
```yaml
oak_fe:
  container_name: oak_fe
  build:
    context: .
    dockerfile: dockerfiles/vite_oak/Dockerfile
  volumes:
    - ./frontend:/home/node/app
    - ./docker_volumes/node_modules:/home/node/app/node_modules
    - ./docker_volumes/static:/home/node/app/dist
  ports:
    - 0.0.0.0:3020:8080
  env_file: .env
```

**Update `oak_proxy` volumes and links:**
```yaml
oak_proxy:
  volumes:
    - ./proxy/static/:/var/www/html/static/
    - ./docker_volumes/static/index.html:/var/www/html/static/index.html
    - ./docker_volumes/static/assets/js/:/var/www/html/static/assets/js/
    - ./docker_volumes/static/assets/css/:/var/www/html/static/assets/css/
    - ./docker_volumes/proxy_configuration:/var/www/html/configuration/
    - ./docker_volumes/proxy_cache:/var/www/html/cache/
  links:
    - oak_app:backend
    - oak_fe:frontend
  depends_on:
    - oak_app
    - oak_fe
```

Also add `docker_volumes/node_modules/` and `docker_volumes/static/` to `.gitignore` (or add `.keep` files).

### Step 5 — Update proxy configuration

**Add `docker_volumes/proxy_configuration/rules/frontend.php`**, mirroring `../weave/docker_volumes/proxy_configuration/rules/frontend.php`:

- When `FRONTEND_DEV_MODE=true`: proxy `/`, `/assets/js/`, `/assets/css/`, `/@vite/`, `/node_modules/`, `/@react-refresh` to `http://frontend:8080`
- When `FRONTEND_DEV_MODE=false`: serve built files from `/var/www/html/static`; serve `/` by rewriting to `/index.html`

**Update `docker_volumes/proxy_configuration/configure.php`**: add `require_once __DIR__ . '/rules/frontend.php';` before the backend rule.

**Update `docker_volumes/proxy_configuration/rules/backend.php`**: narrow from the current catch-all (`begins_with '/'`) to only JSON API requests:
- Match `ends_with .json` or `begins_with /api/` (whichever matches the Rails API URL pattern)

### Step 6 — Implement the React application

Build the React SPA to match the current AngularJS UI, resource by resource. For each resource (categories, items, kinds, links, photos, subscriptions):

- Create a route in React Router matching the existing path
- Create `index`, `show`, `new`, `edit` page components
- Fetch data from the existing JSON API endpoints (e.g., `/categories.json`, `/categories/:id.json`)
- Use `@tanstack/react-query` for data fetching and caching
- Use Bootstrap / react-bootstrap for styling to preserve the current look

### Step 7 — Add frontend CI jobs to CircleCI

Update `.circleci/config.yml` following the weave pattern. Note: the `release` job already exists in oak's CI using `darthjee/vite_weave-base:0.0.4`; align the new jobs with it.

Add:
- `frontend-checks` job: yarn install → `npm run lint` (ESLint), using `darthjee/circleci_node` image
- `jasmine` job: yarn install → `npm test`, using `darthjee/circleci_node` image
- `upload_fe_files` job: build Vite assets → upload to production server
- Wire all new jobs into the `test` workflow; gate `build-and-release` on them

### Step 8 — Remove AngularJS from Rails (cleanup)

Once the React frontend is complete and validated in production:

- Remove AngularJS and Cyberhawk JS assets from `source/app/assets/`
- Remove ERB templates no longer served by Rails (HTML-only views used for `?ajax=true` fragments)
- Remove the `OnePageApplication` concern and related redirect logic from controllers
- Remove `?ajax=true` handling from controllers (keep JSON endpoints intact)
- Update `source/config/routes.rb` to remove HTML routes no longer served by Rails

---

## Files to Change

| File | Change |
|------|--------|
| `frontend/` | New directory — React + Vite project |
| `proxy/static/` | New directory — static assets served by tent |
| `dockerfiles/vite_oak-base/Dockerfile` | New — base image (to be published) |
| `dockerfiles/vite_oak/Dockerfile` | New — dev image for docker-compose |
| `docker-compose.yml` | Add `oak_fe`; update `oak_proxy` volumes and links |
| `docker_volumes/static/` | New volume (Vite output + proxy overlay) |
| `docker_volumes/node_modules/` | New volume (node_modules cache) |
| `docker_volumes/proxy_configuration/configure.php` | Add `require_once` for `frontend.php` |
| `docker_volumes/proxy_configuration/rules/frontend.php` | New — tent rules for React assets |
| `docker_volumes/proxy_configuration/rules/backend.php` | Narrow from catch-all to JSON API only |
| `.circleci/config.yml` | Add `frontend-checks`, `jasmine`, `upload_fe_files` jobs |
| `source/app/assets/` | Remove AngularJS/Cyberhawk assets (Step 8) |
| `source/app/views/` | Remove HTML-only ERB templates (Step 8) |
| `source/app/controllers/concerns/one_page_application.rb` | Remove (Step 8) |

---

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `frontend/`: `yarn install && npm run lint` / `npm test` (CircleCI jobs: `frontend-checks`, `jasmine`)
- `source/`: `bundle exec rspec` (CircleCI job: `test`) and `bundle exec rubocop` (CircleCI job: `checks`)

---

## Notes

- Steps 1–5 (scaffold + infrastructure) can be done without breaking the current app.
- Step 6 (React implementation) is the largest phase and will be broken into sub-issues per resource.
- Step 8 (cleanup) should only happen after Step 6 is fully validated in production.
- `FRONTEND_DEV_MODE` in `.env` controls whether tent proxies to the live Vite dev server or serves pre-built static files.
- The `vite_oak-base` Docker image needs to be built and published to Docker Hub before CI works end-to-end; until then, `darthjee/vite_weave-base:0.0.4` can be used as a temporary stand-in (already referenced in the existing `release` CI job).
- React Router will use browser history (clean URLs, e.g. `/categories`), not AngularJS's hash anchors (`#/categories`). The tent proxy's catch-all rule for `/` → `index.html` handles direct URL access.
- The `docker_volumes/static/` directory is shared between `oak_fe` (writes Vite output to `dist/`) and `oak_proxy` (reads from it to serve assets).
