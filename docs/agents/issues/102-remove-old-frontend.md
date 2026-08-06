# Issue: Remove old frontend

## Description

The old frontend — AngularJS (`ng-app`/`ng-view`) + ERB views + Magicka-rendered form/display elements, backed by the legacy Sprockets JS/CSS asset pipeline — is removed from the Rails backend, which becomes API-only. The new React/Vite frontend already has full parity for every migrated resource (categories, items, kinds, home, index_categories, login), so the old stack is redundant. This also means removing the `magicka` gem and its usage doc (`docs/agents/external/magicka-usage.md`).

## Problem

The Rails backend still renders a full second frontend that the Tent proxy no longer routes any live traffic to — every non-JSON GET already goes to the React app or gets redirected to its `#/<path>` hash route. Keeping the old stack means unnecessary Sprockets asset compilation, the `magicka` gem inflating the `Gemfile`/attack surface, and ongoing maintenance/test burden for code with zero real users.

## Expected Behavior

- `source/` behaves as a pure JSON API for the React-covered resources (categories, items, kinds, home, index_categories, login).
- `admin/users`'s JSON API (`Admin::UsersController`, Azeroth `resource_for`) keeps working exactly as today; only its HTML rendering is removed. Interim user management (until the React admin UI exists) is via Rails console / DB access.
- Unauthorized requests still redirect to `/#/forbidden`; the SPA has no page there yet — an accepted, tracked gap.
- The `magicka` gem, its custom elements, and its templates are fully removed, along with the legacy Sprockets JS/CSS pipeline.

## Solution

### Scope Boundaries

Remove the AngularJS/ERB/Magicka stack: `source/app/views/layouts/application.html.erb` (`ng-app`, `ng-view`) and its partials (`_header`, `_login`, `_header_kind_menu`, `_header_category_menu`), legacy Sprockets JS/CSS (`source/app/assets/javascripts`, `assets/stylesheets`), Magicka form/display templates (`views/templates/forms/`, `views/templates/display/`), `Magicka::Helper` wiring in `ApplicationController`, `source/app/models/magicka/` custom elements, and the ERB views for `categories`, `items`, `kinds`, `home`, `index_categories`, `static` — all of which already have a working React equivalent.

**`admin/users` is included in this issue's removal**, even though it has no React equivalent yet:

- Delete its HTML views (`admin/users/{index,new,edit,show,_form}.html.erb`) and any Magicka-based rendering for it.
- **Keep the JSON API intact** — `Admin::UsersController` (Azeroth `resource_for`), its decorator, and routes stay as-is. Only the HTML rendering path is removed; the controller continues to serve JSON so a future React page needs frontend work only.
- Interim user management (until the React admin UI exists) is via Rails console / DB access — no stopgap rake task.
- Follow-up tracked in **[#225 — Build React admin/users UI](https://github.com/darthjee/oak/issues/225)**, which lists the now-orphaned API routes (`GET/POST /admin/users`, `GET /admin/users/new`, `GET /admin/users/:id`, `GET /admin/users/:id/edit`, `PATCH|PUT /admin/users/:id`, `DELETE /admin/users/:id`) that have no consumer until it's done.

`static#forbidden` (`GET /forbidden`, ERB view) is removed along with the rest of the old frontend. `UserRequired#render_forbidden` already redirects unauthorized requests to `/#/forbidden`, expecting the SPA to render it via hash routing — but React has no `/forbidden` route/page yet. That gap is accepted for now and tracked in **[#226 — Build React /forbidden page](https://github.com/darthjee/oak/issues/226)**.

This means the `magicka` gem itself can be fully removed as part of this issue, since after this cleanup no view in the app renders through it anymore.

### Magicka Removal — Full List

Confirmed in scope, since after removing `admin/users` HTML rendering and all other old views, nothing in the app renders through Magicka anymore:

- `magicka` gem entry in `source/Gemfile` / `source/Gemfile.lock`
- `Magicka::Helper` wiring in `ApplicationController`
- `source/app/models/magicka/` (custom element classes)
- `source/app/views/templates/forms/` and `source/app/views/templates/display/` (Magicka partials)
- `docs/agents/external/magicka-usage.md`
- References to Magicka in `AGENTS.md` and `docs/agents/architecture.md`

### Sprockets Asset Pipeline Gems

The `source/app/assets/javascripts`/`assets/stylesheets` directories being removed are compiled by gems that exist only to serve them. Remove those too, since nothing else in the app depends on Sprockets-based asset compilation once the old shell is gone:

- `sprockets-rails`, `sassc-rails`, `sass-rails`, `uglifier` — all from `source/Gemfile` / `source/Gemfile.lock`

`importmap-rails`, `stimulus-rails`, `turbo-rails`, and `turbolinks` are left alone — they're default Rails 7 scaffolding (default `config/importmap.rb` pins, no actual Stimulus controllers or Turbo Frames in use anywhere in the app) rather than part of the old frontend stack, so removing them is out of scope here.

### Documentation Updates

Beyond the Magicka references already listed above, two docs go stale once this lands and are updated as part of this issue:

- `docs/agents/architecture.md` — Source Code Layout table's description of the legacy Sprockets JS/CSS as "still loaded by application.html.erb for server-rendered (non-SPA) views" no longer applies once that shell and asset pipeline are gone.
- `docs/agents/routes.md` — the `/forbidden` route's "Has a template but no JSON data" description no longer applies once `static#forbidden` is removed (the route now only exists as the SPA hash target `/#/forbidden`, per #226).

### Alternative Solutions

Considered incremental, per-resource removal (separate PRs for categories, items, kinds, admin/users, shell/assets, gem removal last) vs. a single cutover PR. Going with **a single cutover PR**: since the whole app can't meaningfully render two frontends side-by-side, splitting it up would just leave the codebase in a longer-lived mixed old/new state without real benefit, and the `magicka` gem removal is blocked until every old view is gone anyway.

### Backward Compatibility

No schema/data changes — this is a view-layer removal only, and the same Rails backend keeps serving JSON. No blocking concerns:

- Routing is unchanged: both the old AngularJS app and the new React app already use `#/<path>` hash routing, and the Tent proxy already redirects `GET /<path>` (HTML) to `/#/<path>` regardless of which frontend renders it — no URL/bookmark breakage.
- A browser with a stale cached bundle referencing removed Sprockets asset paths or old ERB-rendered AJAX templates (`?ajax=true`) would break until it reloads — same risk as any normal frontend deploy, nothing specific to this removal.
- No external integrations depend on the old server-rendered HTML (internal catalog app).
- The two real functional regressions (admin/users UI, `/forbidden` page) are deliberate accepted gaps tracked in #225/#226, not treated as compatibility breaks.

### Edge Cases

Not worried about old consumers of the removed HTML views (bookmarks, crawlers, emails linking to server-rendered pages) — internal catalog app, low risk, no mitigation needed.

### Testing Strategy

Controller specs with HTML-format contexts (`render_views` + `render_template(...)` examples for the html/ajax paths) exist in:

- `source/spec/controllers/admin/users_controller_spec.rb`
- `source/spec/controllers/categories_controller_spec.rb`
- `source/spec/controllers/index_categories_controller_spec.rb`
- `source/spec/controllers/items_controller_spec.rb`
- `source/spec/controllers/kinds_controller_spec.rb`
- `source/spec/controllers/users_controller_spec.rb`

For each: remove the HTML/ajax `render_template` contexts, keep the JSON-format contexts (the API layer is unchanged). No dedicated view/feature spec directory exists, so there's nothing else to prune there. React/Jasmine coverage for the already-migrated resources (categories, items, kinds, login) is assumed already in place under `frontend/spec/`; no new frontend spec work is needed by this issue itself since it's a removal, not a new feature (admin/users and `/forbidden` frontend coverage will land with #225/#226).

## Benefits

Checked the Tent proxy config (`docker_volumes/proxy_configuration/rules/{frontend,backend,redirects}.php`): `/` and every non-`.json` GET already route to the React frontend (dev: proxied to Vite; prod: served as static `index.html`) or get redirected to `/#/<path>`, in both `FRONTEND_DEV_MODE` states. The old Rails-rendered AngularJS/ERB shell is only reachable by hitting the Rails app directly, bypassing the proxy — which isn't how the app is accessed. So this removal has **no live traffic impact**; it's pure dead-code cleanup, not a risk to mitigate.

Also checked: the `tarquinn` gem, which used to own the Rails-side HTML→`/#/path` redirect, was already removed in a prior cleanup ([#198](https://github.com/darthjee/oak/issues/198)/[#199](https://github.com/darthjee/oak/pull/199)) — nothing left to do there. That redirect now lives entirely in the Tent proxy (`redirects.php`), outside this issue's scope.

Smaller Rails asset pipeline (no Sprockets/AngularJS bundle to compile/serve), smaller `Gemfile`/attack surface (`magicka` gone), less code to maintain. No new security exposure introduced — mailer views (`layouts/mailer.html.erb`) are self-contained and unaffected by the Sprockets/asset removal.
