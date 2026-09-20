# Issue: Backend: kind edit/update support

## Description
Part of #271 (Kind pages). `KindsController` (`source/app/controllers/kinds_controller.rb`) currently only supports `index`, `new`, `create`, and `show` via `resource_for Oak::Kind`. This issue adds `edit`/`update` routes and controller wiring, giving the frontend `KindEdit` page (frontend sub-issue of #271) a backend endpoint to persist changes against.

## Problem
There is no way to edit an existing `Oak::Kind` record. Unlike `Oak::Category`, which already exposes `edit`/`update` via `CategoriesController`, `Oak::Kind` only exposes `new`/`create`/`show`, blocking the frontend edit flow for kinds.

## Expected Behavior
- `GET /kinds/:slug/edit.json` returns the decorated kind: `{ "name": ..., "slug": ..., "snap_url": ... }`.
- `PATCH /kinds/:slug.json` (and `PUT`) updates the kind's `name`, regenerates `slug` via `Slugable`, and returns the decorated kind on success (`200`).
- On validation failure, returns `422` with the same decorated-but-invalid shape, no `errors` key.
- Unauthenticated requests to `edit`/`update` are rejected per `require_user_for`.
- RSpec coverage added for the new controller actions (success, validation failure, unauthenticated).
- RuboCop passes with no new offences.

## Solution
Follow the backend spec at `docs/agents/specs/kind/backend-contracts.md` (written for this issue) exactly:

- **Routes** (`source/config/routes.rb`): extend `resources :kinds` from `only: %i[index new create show]` to `only: %i[index new create show edit update]` (`param: :slug` unchanged).
- **Controller** (`source/app/controllers/kinds_controller.rb`): add `edit update` to the existing second `resource_for Oak::Kind` call's `only: %i[new create show]` (no separate `resource_for` block needed, unlike categories). Add `:edit, :update` to `require_user_for` (currently `:new, :create` only), mirroring `CategoriesController`.
- **Strong params**: reuse the existing `kind_params` (`permit(:name)`) unchanged.
- **No update builder needed**: unlike `Oak::Category::UpdateBuilder` (which reconciles the `kinds` association), `Oak::Kind` has a single `name` attribute (slug is derived automatically via `Slugable`). No `update_with:` option is needed — Azeroth's `Azeroth::RequestHandler::Update` falls back to `resource.update(attributes)`, which is sufficient.
- **Decorator**: reuse `Oak::Kind::Decorator` unchanged (already exposes `name`, `slug`, `snap_url`) — no `Oak::Kind::FormDecorator` needed (unlike `Category`, whose form decorator additionally exposes the `kinds` association).
- **Validation/error responses**: on `422` (e.g. duplicate name causing a `slug` uniqueness failure, blank name, name over 40 chars), Azeroth returns the same decorated shape (`name`, `slug`, `snap_url`) with **no `errors` key**, matching `Oak::Category::FormDecorator`'s current behavior for category create/update failures. The frontend must not attempt to parse field-level errors out of the response body.

Kind deletion/destroy is explicitly out of scope.

## Benefits
Unblocks the frontend `KindEdit` page and brings `Oak::Kind` to parity with `Oak::Category`'s existing edit/update support.
