# Architecture

## Overview

Oak is a Rails monolithic application that serves JSON endpoints and the SPA shell from the same process. The frontend is a Single Page Application (SPA) built with **React** + **Vite** in `frontend/`, styled with **Bootstrap**, and mounted into `frontend/index.html` via `frontend/assets/js/main.jsx`. All Rails code lives under `source/`.

In development and production a reverse proxy (**darthjee/tent**) sits in front of the Rails app to cache HTML responses and simulate the production setup. In development the proxy runs as the `oak_proxy` Docker service (port 3000); in production the same proxy binary runs natively (without Docker). See [HOW_TO_USE_DARTHJEE-TENT.md](external/HOW_TO_USE_DARTHJEE-TENT.md) for full proxy configuration reference.

---

## Infrastructure

```
Browser
  │
  ▼
darthjee/tent (proxy)          ← caches HTML; port 3000 in dev
  │
  ▼
Rails app (oak_app)            ← port 3010 in dev, 3000 internally
  ├── MySQL (oak_mysql)        ← primary database
  ├── Redis (oak_redis)        ← Sidekiq queue
  ├── Sidekiq (oak_sidekiq)    ← background jobs (photo processing)
  └── Apache httpd (oak_photos) ← static photo/file serving; port 3001
```

In production there is no `oak_photos` container; uploaded files are served by the production infrastructure directly.

---

## Request Routing

Frontend-serving requests follow one of these paths:

| Pattern | Behaviour |
|---------|-----------|
| `GET /` | Serves the SPA shell (`index.html`) handled by `HomeController`, which boots the React app. |
| `GET /<path>` (HTML) | Redirected to `/#/<path>` by the Tent proxy (`rules/redirects.php`) before the request reaches Rails. |
| `GET /<path>.json` | Returns JSON payloads for frontend data loading via Azeroth decorators. |

All redirect and HTML cache logic lives exclusively in the Tent proxy configuration.

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
  - See [HOW_TO_USE_DARTHJEE-TENT.md](external/HOW_TO_USE_DARTHJEE-TENT.md) for rule/middleware details.

---

## Source Code Layout (`source/app/`)

| Directory | Role |
|-----------|------|
| `controllers/` | Rails controllers. All include `Azeroth::Resourceable`. `ApplicationController` wires up Azeroth globally. |
| `controllers/concerns/` | Shared controller behaviour (`UserRequired`, `LoggedUser`, etc.). |
| `models/oak/` | ActiveRecord models (`Category`, `Item`, `Kind`, `Link`, `Photo`, `Subscription`). |
| `decorators/oak/` | Azeroth decorators — control which attributes are exposed in JSON responses. One decorator (sub)directory per resource. |
| `builders/oak/` | Sinclair builders — encapsulate complex object construction logic outside of models. |
| `views/layouts/` | `mailer.html.erb`/`mailer.text.erb` only — the old AngularJS/ERB shell and per-resource views were removed once the React/Vite frontend reached full parity. |
| `jobs/` | Sidekiq background jobs for photo processing (`CreateItemPhotosJob`, `ProcessUserItemPhotosJob`). |
| `utils/` | Utility/helper modules shared across the application. |
| `helpers/` | Rails view helpers (`ApplicationHelper`, `Path::SafePath`). |
| `assets/images/` | Static image assets. The legacy Sprockets JS/CSS pipeline (`assets/javascripts/`, `assets/stylesheets/`) was removed along with the old frontend shell. |

---

## Key Gems and Their Role

| Gem | Role |
|-----|------|
| **[Azeroth](https://github.com/darthjee/azeroth)** | Generates standard CRUD controller actions and JSON serialization via decorators. See [azeroth-usage.md](external/azeroth-usage.md). |
| **[Sinclair](https://github.com/darthjee/sinclair)** | Dynamic method builder; also used for configuration (`Sinclair::Configurable`), option objects, and plain models. See [sinclair-usage.md](external/sinclair-usage.md). |
| **[Jace](https://github.com/darthjee/jace)** | Internal event/lifecycle hooks for service operations. See [jace-usage.md](external/jace-usage.md). |
| **Sidekiq** | Background job processing (photo upload pipeline). |

---

## Template Rendering Pattern

`source/` is a pure JSON API for the React-covered resources (categories, items, kinds, home, index_categories, login) — Rails no longer renders any application page. The old AngularJS + ERB + Magicka shell was removed once the React/Vite frontend reached parity; only the mailer layouts (`views/layouts/mailer.html.erb`/`mailer.text.erb`) remain under `views/`. All frontend SPA pages are rendered in React (`frontend/`).
