# Infrastructure Plan: React Front-End Setup

Steps 1–5 of [plan.md](plan.md). Everything needed to run the React app in Docker alongside the existing Rails app, without breaking the current setup.

---

## Step 1 — Scaffold `frontend/`

Create `frontend/` at the project root with a React + Vite setup, mirroring `../weave/frontend/`:

- `frontend/package.json` — React 19, react-dom, react-router-dom, bootstrap, react-bootstrap, @tanstack/react-query; dev: vite, @vitejs/plugin-react, eslint, jasmine, nyc, sass
- `frontend/vite.config.js` — server on `0.0.0.0:8080`, React plugin with babel-plugin-react-compiler
- `frontend/index.html` — SPA entry point
- `frontend/assets/` — static assets (images, fonts)
- `frontend/spec/` — Jasmine unit tests
- `frontend/eslint.config.mjs` — ESLint config (matching weave)
- `frontend/yarn.lock` — lock file

---

## Step 2 — Create `proxy/static/`

Create a `proxy/static/` directory for static assets served directly by tent (images, etc.), mirroring `../weave/proxy/static/`. This folder is mounted at `/var/www/html/static/` inside the proxy container. The Vite-built `index.html`, JS and CSS from `docker_volumes/static/` are overlaid on top of it via separate volume mounts.

---

## Step 3 — Create two Dockerfiles for the frontend

Following the weave two-image pattern (reference: `../weave/dockerfiles/vite_weave-base/` and `../weave/dockerfiles/vite_weave/`):

### `dockerfiles/vite_oak-base/Dockerfile`

Base image, to be published as `darthjee/vite_oak-base`. Mirrors `../weave/dockerfiles/vite_weave-base/Dockerfile`:

- From `darthjee/node:0.2.1`
- Install rsync
- Copy `frontend/package.json` and `frontend/yarn.lock` into `/home/node/app/`
- Copy `deploy_frontend.sh` from `darthjee/scripts`
- Pre-warm yarn cache via `yarn_builder.sh`
- Default `CMD ["npm", "run", "server"]`

### `dockerfiles/vite_oak/Dockerfile`

Dev image used in docker-compose. Mirrors `../weave/dockerfiles/vite_weave/Dockerfile`:

- From `darthjee/vite_oak-base`
- Copies `frontend/package.json` and `frontend/yarn.lock`
- Pre-warms yarn cache (so `docker-compose build` pre-installs node_modules)

> Until `darthjee/vite_oak-base` is published to Docker Hub, CI and docker-compose can temporarily reference `darthjee/vite_weave-base:0.0.4` (already used in the existing `release` CI job).

---

## Step 4 — Update `docker-compose.yml`

### Add `oak_fe` service

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

### Update `oak_proxy`

Replace the current volumes/links with:

```yaml
oak_proxy:
  image: darthjee/tent:0.5.0
  container_name: oak_proxy
  env_file: .env
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
  ports:
    - 0.0.0.0:3000:80
```

### New docker_volumes entries

Add `.keep` files (or gitignore entries) for the new shared volumes:
- `docker_volumes/static/` — written by `oak_fe` (Vite `dist/`), read by `oak_proxy`
- `docker_volumes/node_modules/` — node_modules cache for `oak_fe`

---

## Step 5 — Update proxy configuration

Reference: `../weave/docker_volumes/proxy_configuration/`

### New file: `docker_volumes/proxy_configuration/rules/frontend.php`

```php
<?php
// ... (use statements)

if (getenv('FRONTEND_DEV_MODE') === 'true') {
    // Proxy to live Vite dev server
    Configuration::buildRule([
        'handler' => ['type' => 'proxy', 'host' => 'http://frontend:8080'],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/',              'type' => 'exact'],
            ['method' => 'GET', 'uri' => '/assets/js/',    'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/assets/css/',   'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/@vite/',        'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/node_modules/', 'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/@react-refresh','type' => 'exact'],
        ]
    ]);
} else {
    // Serve pre-built static files
    Configuration::buildRule([
        'handler' => ['type' => 'static', 'location' => '/var/www/html/static'],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/assets', 'type' => 'begins_with'],
        ]
    ]);
    Configuration::buildRule([
        'handler' => ['type' => 'static', 'location' => '/var/www/html/static'],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/', 'type' => 'exact'],
        ],
        'middlewares' => [
            ['class' => 'Tent\Middlewares\SetPathMiddleware', 'path' => '/index.html']
        ]
    ]);
}
```

### Update `docker_volumes/proxy_configuration/configure.php`

Add `require_once` for `frontend.php` **before** `backend.php` so frontend routes are matched first:

```php
require_once __DIR__ . '/rules/frontend.php';
require_once __DIR__ . '/rules/backend.php';
```

### Update `docker_volumes/proxy_configuration/rules/backend.php`

Narrow the existing catch-all rule (`begins_with '/'`) to only match JSON API requests. The exact matcher depends on the Rails API URL structure — likely `ends_with .json` or a prefix pattern. This prevents the backend from intercepting HTML navigation requests that should now be handled by the React SPA.

---

## Notes

- With `FRONTEND_DEV_MODE=true` in `.env`, tent proxies to the live Vite server at port 8080 — HMR works out of the box.
- With `FRONTEND_DEV_MODE=false`, tent serves the pre-built files from `docker_volumes/static/` overlaid on `proxy/static/`.
- The `docker_volumes/static/` directory is shared: `oak_fe` writes Vite output to `dist/`, `oak_proxy` reads it to serve assets.
