# Architecture

Oak is a Rails monolith that serves JSON endpoints and the SPA shell from the same process, fronted by a reverse proxy that caches HTML and simulates production locally. This page covers the high-level overview and frontend summary; see the linked pages for infrastructure/request-routing detail and the backend source layout.

- [Infrastructure](infrastructure.md) — service topology and request routing.
- [Backend Layout](backend-layout.md) — `source/app/` layout, key gems, template rendering pattern.

---

## Overview

The frontend is a Single Page Application (SPA) built with **React** + **Vite** in `frontend/`, styled with **Bootstrap**, and mounted into `frontend/index.html` via `frontend/assets/js/main.jsx`. All Rails code lives under `source/`.

In development and production a reverse proxy (**darthjee/tent**) sits in front of the Rails app to cache HTML responses and simulate the production setup. In development the proxy runs as the `oak_proxy` Docker service (port 3000); in production the same proxy binary runs natively (without Docker). See [HOW_TO_USE_DARTHJEE-TENT.md](../external/HOW_TO_USE_DARTHJEE-TENT.md) for full proxy configuration reference.

---

## Frontend

- **React + Vite** — client-side application and build/dev tooling (`frontend/`, `vite.config.js`).
- **Hash-based routing utilities** — `AppController` + `HashRouteResolver` + `Router`/`Route` resolve `#/<path>` URLs and route params.
- **React Query** — mounted in `main.jsx` through `QueryClientProvider` for async state/query lifecycle.
- **Bootstrap** — CSS framework used throughout the React frontend.
- Routes are anchor-based (`#/<path>`); after initial load, navigation stays in the SPA shell.
- **Tent proxy** serves frontend differently by mode:
  - `FRONTEND_DEV_MODE=true`: proxies `/`, `/assets/js/`, `/assets/css/`, `/assets/images/`, `/@vite/`, `/node_modules/`, and `/@react-refresh` to `http://frontend:8080` (Vite + HMR).
  - `FRONTEND_DEV_MODE=false`: serves static files from `/var/www/html/static`; `/` is rewritten to `/index.html`.
  - See [HOW_TO_USE_DARTHJEE-TENT.md](../external/HOW_TO_USE_DARTHJEE-TENT.md) for rule/middleware details.

See [../frontend/index.md](../frontend/index.md) for the component pattern, dev workflow, and linting detail.
