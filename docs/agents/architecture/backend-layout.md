# Backend Layout

The `source/app/` directory layout, the key gems the backend relies on, and why `source/` no longer renders any application templates.

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
| **[Azeroth](https://github.com/darthjee/azeroth)** | Generates standard CRUD controller actions and JSON serialization via decorators. See [azeroth-usage.md](../external/azeroth-usage.md). |
| **[Sinclair](https://github.com/darthjee/sinclair)** | Dynamic method builder; also used for configuration (`Sinclair::Configurable`), option objects, and plain models. See [sinclair-usage.md](../external/sinclair-usage.md). |
| **[Jace](https://github.com/darthjee/jace)** | Internal event/lifecycle hooks for service operations. See [jace-usage.md](../external/jace-usage.md). |
| **Sidekiq** | Background job processing (photo upload pipeline). |

---

## Template Rendering Pattern

`source/` is a pure JSON API for the React-covered resources (categories, items, kinds, home, index_categories, login) — Rails no longer renders any application page. The old AngularJS + ERB + Magicka shell was removed once the React/Vite frontend reached parity; only the mailer layouts (`views/layouts/mailer.html.erb`/`mailer.text.erb`) remain under `views/`. All frontend SPA pages are rendered in React (`frontend/`).
