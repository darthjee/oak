# Backend Plan: Backend: kind edit/update support

Main plan: [plan.md](plan.md)

## Overview
Extend `KindsController` and `routes.rb` to expose `edit`/`update` for `Oak::Kind`, following the pattern already established by `CategoriesController`/`Oak::Category`, but without a builder or a form decorator — `Oak::Kind` only has `name` (slug is auto-derived via `Slugable`), so Azeroth's default `resource.update(attributes)` and the existing `Oak::Kind::Decorator` are sufficient.

## Context
`KindsController` (`source/app/controllers/kinds_controller.rb`) currently supports `index`, `new`, `create`, `show` via two `resource_for Oak::Kind` calls. There is no `edit`/`update`, blocking the frontend `KindEdit` page. Kind deletion/destroy is out of scope. Full contract (routes, request/response shapes, validation/error behavior) is specified in `docs/agents/specs/kind/backend-contracts.md`.

## Implementation Steps

### Step 1 — Add edit/update routes and controller wiring
- In `source/config/routes.rb`, extend the `resources :kinds` line from `only: %i[index new create show]` to `only: %i[index new create show edit update]` (`param: :slug` unchanged).
- In `source/app/controllers/kinds_controller.rb`, add `edit update` to the second `resource_for Oak::Kind` call's `only: %i[new create show]` list (the one already using `id_key: :slug, param_key: :slug`). Do not add `update_with:` — Azeroth's default `resource.update(attributes)` is correct for a single-attribute model like `Kind`.
- Add `:edit, :update` to `require_user_for` (currently `:new, :create` only), mirroring `CategoriesController`'s `require_user_for :new, :create, :edit, :update`.
- Leave `kind_params` (`permit(:name)`) and `Oak::Kind::Decorator` unchanged — both already cover everything `edit`/`update` need.

### Step 2 — Add RSpec coverage
Add `GET #edit` and `PATCH #update` describe blocks to `source/spec/controllers/kinds_controller_spec.rb`, following the same structure already used there for `GET #new`/`POST #create` (and mirroring `categories_controller_spec.rb`'s `GET #edit`/`PATCH #update` blocks, minus anything related to the `kinds` association, which `Oak::Kind` doesn't have):

- `GET #edit` (JSON format):
  - when user is logged in: returns `200` and the JSON matches `Oak::Kind::Decorator.new(kind).as_json`.
  - when user is not logged in: returns `302` redirect to `/#/forbidden`.
- `PATCH #update`:
  - when the request is valid: updates the kind's `name` (and regenerated `slug`), returns `200`, and the JSON matches `Oak::Kind::Decorator.new(kind.reload).as_json`.
  - when the request is invalid (e.g. blank `name`): does not update the kind, returns `422` (`:unprocessable_content`), and the JSON matches `Oak::Kind::Decorator.new(expected_kind).tap(&:validate).as_json` (no `errors` key).
  - when user is not logged in: returns `302` redirect to `/#/forbidden`.

## Files to Change
- `source/config/routes.rb` — add `edit update` to the `kinds` resource.
- `source/app/controllers/kinds_controller.rb` — add `edit update` to the `resource_for` call and to `require_user_for`.
- `source/spec/controllers/kinds_controller_spec.rb` — add `GET #edit` and `PATCH #update` coverage.

## CI Checks
- `source`: `bundle exec rspec` (CI job: `test`)
- `source`: `bundle exec rubocop` (CI job: `checks`)

## Notes
- No new builder or decorator needed — `Oak::Kind`'s single `name` attribute makes `Oak::Category::UpdateBuilder`/`FormDecorator`'s extra complexity (association reconciliation) unnecessary here.
- Validation failures return the same decorated shape with no `errors` key, per `docs/agents/specs/kind/backend-contracts.md` — the frontend (separate issue) must not expect field-level errors.
