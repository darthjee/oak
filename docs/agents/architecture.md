# Architecture

## Overview

Oak is a Rails monolithic application that serves both the frontend and the JSON API from the same process. The frontend is a Single Page Application (SPA) built with **AngularJS** and styled with **Bootstrap**. All Rails code lives under `source/`.

In development and production a reverse proxy (**darthjee/tent**) sits in front of the Rails app to cache HTML responses and simulate the production setup. In development the proxy runs as the `oak_proxy` Docker service (port 3000); in production the same proxy binary runs natively (without Docker).

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

Every HTTP request to the Rails app follows one of four paths:

| Pattern | Behaviour |
|---------|-----------|
| `GET /` | Renders the home page (layout + full HTML). Handled by `HomeController`. |
| `GET /<path>` (HTML, no `?ajax`) | Redirected to `/#/<path>` by the `OnePageApplication` concern so AngularJS takes over navigation. No data is fetched. |
| `GET /<path>?ajax=true` | Returns the ERB template for that route **without the application layout**. AngularJS (via Cyberhawk) fetches this to render the view. |
| `GET /<path>.json` | Returns the JSON payload for that route via Azeroth decorators. AngularJS fetches this for the data. |

The redirect logic lives in `app/controllers/concerns/one_page_application.rb`, which uses the **Tarquinn** gem. Controllers include `OnePageApplication` to opt in to SPA behaviour.

---

## Frontend

- **AngularJS** — handles client-side routing via URL anchors (`#/<path>`).
- **Cyberhawk** (<https://github.com/darthjee/cyberhawk>) — manages the request lifecycle: intercepts anchor navigation, fetches `?ajax=true` templates and `.json` data, then renders the page.
- **Bootstrap** — CSS framework used in all ERB templates.
- Routes are defined with anchors; no full page reloads happen after the initial load.

---

## Source Code Layout (`source/app/`)

| Directory | Role |
|-----------|------|
| `controllers/` | Rails controllers. All include `Azeroth::Resourceable`; most resource controllers also include `OnePageApplication`. `ApplicationController` wires up Azeroth and Magicka helpers globally. |
| `controllers/concerns/` | Shared controller behaviour (`OnePageApplication`, etc.). |
| `models/oak/` | ActiveRecord models (`Category`, `Item`, `Kind`, `Link`, `Photo`, `Subscription`). |
| `models/magicka/` | Custom Magicka element classes (form/display widgets). |
| `decorators/oak/` | Azeroth decorators — control which attributes are exposed in JSON responses. One decorator (sub)directory per resource. |
| `builders/oak/` | Sinclair builders — encapsulate complex object construction logic outside of models. |
| `views/<resource>/` | ERB templates. Each resource has `index`, `new`, `edit`, `show`, and a shared `_form.html.erb` partial. |
| `views/templates/forms/` | Magicka form element partials (e.g., `_input`, `_ng_select`, `_button`). |
| `views/templates/display/` | Magicka display element partials (e.g., `_text`, `_ng_select_text`, `_ng_pagination`). |
| `jobs/` | Sidekiq background jobs for photo processing (`CreateItemPhotosJob`, `ProcessUserItemPhotosJob`). |
| `utils/` | Utility/helper modules shared across the application. |

---

## Key Gems and Their Role

| Gem | Role |
|-----|------|
| **[Azeroth](https://github.com/darthjee/azeroth)** | Generates standard CRUD controller actions and JSON serialization via decorators. See [azeroth-usage.md](azeroth-usage.md). |
| **[Magicka](https://github.com/darthjee/magicka)** | Renders AngularJS-compatible form and display elements inside ERB templates. See [magicka-usage.md](magicka-usage.md). |
| **[Sinclair](https://github.com/darthjee/sinclair)** | Dynamic method builder; also used for configuration (`Sinclair::Configurable`), option objects, and plain models. See [sinclair-usage.md](sinclair-usage.md). |
| **[Tarquinn](https://github.com/darthjee/tarquinn)** | Declarative controller-level redirection rules (powers the SPA redirect). See [tarquinn-usage.md](tarquinn-usage.md). |
| **[Jace](https://github.com/darthjee/jace)** | Internal event/lifecycle hooks for service operations. See [jace-usage.md](jace-usage.md). |
| **Sidekiq** | Background job processing (photo upload pipeline). |

---

## Template Rendering Pattern

Views follow a consistent three-file pattern per resource:

```
new.html.erb   → magicka_form  → renders _form.html.erb
edit.html.erb  → magicka_form  → renders _form.html.erb
show.html.erb  → magicka_display → renders _form.html.erb
```

`_form.html.erb` uses `form.only(:form)` / `form.only(:display)` to conditionally render editable vs. read-only elements in the same partial.

When `?ajax=true` is present, the layout is suppressed and only the template fragment is returned so Cyberhawk can inject it into the SPA shell.
