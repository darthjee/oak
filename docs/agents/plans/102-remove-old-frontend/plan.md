# Plan: Remove old frontend

Issue: [102-remove-old-frontend.md](../../issues/102-remove-old-frontend.md)

## Overview

Remove the old AngularJS + ERB + Magicka frontend stack from `source/`, leaving it as a pure JSON API for the resources already covered by the React frontend (categories, items, kinds, home, index_categories, login). `admin/users` loses its HTML views but keeps its JSON API; `/forbidden` is dropped entirely. The `magicka` gem and the now-unused Sprockets asset-pipeline gems are removed, controller specs are trimmed to JSON-only contexts, and the stale docs describing the old stack are updated. Single cutover PR — no incremental per-resource split.

## Context

The Tent proxy already routes all non-JSON traffic to the React app (or redirects it to `/#/<path>`), so the Rails-rendered AngularJS/ERB shell is unreachable in practice — this is dead-code cleanup, not a live-traffic risk. Two known functional gaps (`admin/users` UI, `/forbidden` page) are deliberately deferred to follow-up issues [#225](https://github.com/darthjee/oak/issues/225) and [#226](https://github.com/darthjee/oak/issues/226) and are not blockers here.

## Implementation Steps

### Step 1 — Remove the old frontend shell, views, and legacy assets

Delete:
- `source/app/views/layouts/application.html.erb` and its partials: `_header.html.erb`, `_login.html.erb`, `_header_kind_menu.html.erb`, `_header_category_menu.html.erb`
- ERB views for the migrated resources: `source/app/views/{categories,items,kinds,home,index_categories}/**`
- Legacy Sprockets JS/CSS: `source/app/assets/javascripts/**`, `source/app/assets/stylesheets/**`, `source/app/assets/config/manifest.js`
- Leave `source/app/views/layouts/mailer.html.erb`/`mailer.text.erb` untouched — self-contained, unrelated to Sprockets/AngularJS.

Controllers themselves (`CategoriesController`, `ItemsController`, `KindsController`, etc.) need no code change — Azeroth's `resource_for` keeps serving JSON as-is; only the HTML render path becomes unreachable once its views are gone (which matches current live traffic already).

### Step 2 — Remove `/forbidden` and its controller

Delete `source/app/views/static/forbidden.html.erb`, `source/app/controllers/static_controller.rb` (its only action is `forbidden`, so the whole controller goes), and the route `get '/forbidden' => 'static#forbidden', as: :forbidden` in `source/config/routes.rb`. No spec file exists for `StaticController`, so nothing to remove there. `UserRequired#render_forbidden` keeps redirecting to `/#/forbidden` — the SPA has no page there yet, tracked in #226; that redirect logic itself needs no change.

### Step 3 — Remove `admin/users` HTML views only

Delete `source/app/views/admin/users/{index,new,edit,show,_form}.html.erb`. Keep `Admin::UsersController`, its decorator, routes, and params as-is — the JSON API is unaffected.

### Step 4 — Remove Magicka

- Remove `gem 'magicka', '>= 1.2.0'` from `source/Gemfile`
- Remove `helper Magicka::Helper` from `source/app/controllers/application_controller.rb`
- Delete `source/app/models/magicka/` (all 6 custom element classes: `ng_select.rb`, `ng_select_text.rb`, `ng_checkbox.rb`, `ng_pagination.rb`, `ng_textarea.rb`, `ng_checkbox_text.rb`)
- Delete `source/app/views/templates/forms/**` and `source/app/views/templates/display/**`
- Delete `docs/agents/external/magicka-usage.md`

### Step 5 — Remove the Sprockets asset-pipeline gems

Remove `sprockets-rails`, `sassc-rails`, `sass-rails`, and `uglifier` from `source/Gemfile` — they exist only to compile the JS/CSS pipeline removed in Step 1. Leave `importmap-rails`, `stimulus-rails`, `turbo-rails`, `turbolinks` alone (default Rails 7 scaffolding, not part of the old frontend, no active Stimulus/Turbo usage in the app).

After editing `source/Gemfile`, run `bundle install` inside `source/` to regenerate `source/Gemfile.lock` — never hand-edit the lockfile.

### Step 6 — Trim controller specs to JSON-only

In each of the following, remove the HTML/ajax contexts (`render_views` + `render_template(...)` examples for `format: :html`/`ajax: true`) and keep the JSON-format contexts untouched:
- `source/spec/controllers/admin/users_controller_spec.rb`
- `source/spec/controllers/categories_controller_spec.rb`
- `source/spec/controllers/index_categories_controller_spec.rb`
- `source/spec/controllers/items_controller_spec.rb`
- `source/spec/controllers/kinds_controller_spec.rb`
- `source/spec/controllers/users_controller_spec.rb`

No dedicated view/feature spec directory exists, so nothing else to prune.

### Step 7 — Update documentation

- `AGENTS.md` — remove the "Magicka Usage" section and the "Update the Views with Magicka" / "Creating a New Magicka Element" steps from the resource-creation walkthrough (that workflow now ends once the JSON API + React UI exist; no ERB/Magicka step remains).
- `docs/agents/architecture.md` — remove the `models/magicka/`, `views/templates/forms/`, `views/templates/display/` rows and the Magicka external-tool entry from the Source Code Layout / External Tools tables; update or remove the `assets/javascripts/`, `assets/stylesheets/` row (no longer loaded by anything, since `application.html.erb` is gone); remove the `new/edit/show → magicka_form/magicka_display` example.
- `docs/agents/routes.md` — update the `/forbidden` row: the route no longer exists as a Rails route (only as the SPA hash target `/#/forbidden`, per #226); remove or rewrite the row accordingly.

## Files to Change

- `source/app/views/layouts/application.html.erb`, `_header.html.erb`, `_login.html.erb`, `_header_kind_menu.html.erb`, `_header_category_menu.html.erb` — delete
- `source/app/views/{categories,items,kinds,home,index_categories}/**` — delete
- `source/app/assets/javascripts/**`, `source/app/assets/stylesheets/**`, `source/app/assets/config/manifest.js` — delete
- `source/app/views/static/forbidden.html.erb` — delete
- `source/app/controllers/static_controller.rb` — delete
- `source/config/routes.rb` — remove `/forbidden` route
- `source/app/views/admin/users/{index,new,edit,show,_form}.html.erb` — delete
- `source/Gemfile` — remove `magicka`, `sprockets-rails`, `sassc-rails`, `sass-rails`, `uglifier`
- `source/Gemfile.lock` — regenerated via `bundle install`
- `source/app/controllers/application_controller.rb` — remove `helper Magicka::Helper`
- `source/app/models/magicka/**` — delete
- `source/app/views/templates/forms/**`, `source/app/views/templates/display/**` — delete
- `docs/agents/external/magicka-usage.md` — delete
- `source/spec/controllers/admin/users_controller_spec.rb` — remove HTML/ajax contexts
- `source/spec/controllers/categories_controller_spec.rb` — remove HTML/ajax contexts
- `source/spec/controllers/index_categories_controller_spec.rb` — remove HTML/ajax contexts
- `source/spec/controllers/items_controller_spec.rb` — remove HTML/ajax contexts
- `source/spec/controllers/kinds_controller_spec.rb` — remove HTML/ajax contexts
- `source/spec/controllers/users_controller_spec.rb` — remove HTML/ajax contexts
- `AGENTS.md` — remove Magicka usage section and workflow steps
- `docs/agents/architecture.md` — remove Magicka/Sprockets layout rows and example
- `docs/agents/routes.md` — update `/forbidden` row

## CI Checks

- `source`: `cd source && bundle exec rspec` (CI job: `test`)
- `source`: `cd source && bundle exec rubocop` (CI job: `checks`)

## Notes

- `admin/users` and `/forbidden` React equivalents are intentionally out of scope — tracked in #225 and #226, not regressions to fix here.
- No schema/data migration involved; this is a view-layer + dependency removal only.
- After removing Sprockets gems, double-check `source/config/environments/*.rb` and `source/config/initializers/*` for now-dead asset-pipeline config (e.g. `config.assets.*`) and remove any that no longer applies once `sprockets-rails` is gone.
