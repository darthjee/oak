# Backend Plan: Backend — photo migration state and prepare/confirm endpoints

Main plan: [plan.md](plan.md)

Issue: [380-backend-photo-migration-state-and-prepare-confirm-endpoints.md](../../issues/380-backend-photo-migration-state-and-prepare-confirm-endpoints.md)

## Overview

Track the migration of legacy photo files per row (`migration_status`, `migration_file_name`, `migration_claimed_at`), reuse the existing UUID naming, and expose `POST /user/photos/migration/prepare` and `PATCH /user/photos/migration` for the proxy (#381). This issue merges and deploys before the proxy and frontend sub-issues.

## Context

- `photos` currently has `item_id`, `order`, `file_name` (unique per item) and `ready`. Legacy rows got `ready: true` from `AddReadyToPhotos`.
- `Oak::Photo::CreateBuilder#unique_file_name` builds `<sanitized_stem>-<uuid><ext>`.
- `CreateItemPhotosJob` creates `ready: true` rows from files already under `<photos_path>/origin/...`, which is the new root. The owner runs it by hand and won't run it until the migration is done.
- `LoggedUser` rescues `NotLogged` as `not_found` (404), but this contract needs **401**. The new controller must answer `head :unauthorized` itself when `logged_user` is nil.
- `Oak::Photo` has a `default_scope` with `order`. Use `unscope(:order)` (or `reorder(nil)`) before `update_all`/`count`.
- The existing per-user namespace is `namespace :user` (`User::CategoriesController`).

## Steps

- [01 — Add migration state to photos](backend/01-add-migration-state.md)
- [02 — Extract UUID naming](backend/02-extract-uuid-naming.md)
- [03 — Prepare endpoint](backend/03-prepare-endpoint.md)
- [04 — Confirm endpoint](backend/04-confirm-endpoint.md)

## CI Checks

- `source`: `docker-compose exec oak_app bundle exec rspec` (CI job: RSpec)
- `source`: `docker-compose exec oak_app bundle exec rubocop` (CI job: Rubocop)

## Notes

- True concurrent claiming can't be exercised reliably in RSpec. Instead, cover the conditional update: a claimed row is not re-claimed until it is stale, and a second `prepare` call returns other rows.
- Contract changes (route prefix `/user/...`) must match #381. That issue still says `/users/me/...` and needs updating separately.
- Rows with `ready: false` are excluded both from candidates and from `remaining`.
