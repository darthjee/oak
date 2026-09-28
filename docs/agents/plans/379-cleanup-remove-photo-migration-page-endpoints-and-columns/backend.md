# Backend Plan: Cleanup — remove photo migration page, endpoints and columns

Main plan: [plan.md](plan.md)

## Shared contracts

- Remove `POST /user/photos/migration/prepare` and `PATCH /user/photos/migration`. The proxy stops calling them in the same change.
- Drop `photos.migration_status`, `photos.migration_file_name` and `photos.migration_claimed_at`.

## Steps

- [01 — Remove migration endpoints and helpers](backend/01-remove-endpoints.md)
- [02 — Drop migration columns and model state](backend/02-drop-columns.md)
- [03 — Stop setting migration_status on photo creation](backend/03-stop-setting-status.md)

## CI Checks

- `source`: `bundle exec rspec` (CI job: `test`)
- `source`: `rubocop` (CI job: `checks`)

## Notes

- Keep `Oak::Photo::UniqueFileName` and its spec. `CreateBuilder` still uses it for new uploads.
- Don't edit or delete `20260926120000_add_migration_state_to_photos.rb`. Add a new migration on top of it.
- `source/.rubocop.yml` got a `Metrics/BlockLength` exclusion for `config/routes.rb` in #380. Once the two routes are removed, run rubocop without the exclusion and delete it if the routes block passes.
