# Plan: Cleanup — remove photo migration page, endpoints and columns

Issue: [379-cleanup-remove-photo-migration-page-endpoints-and-columns.md](../../issues/379-cleanup-remove-photo-migration-page-endpoints-and-columns.md)

## Overview

Every legacy photo has been migrated, so the one-off migration flow from #380 (backend), #381 (proxy) and #382 (frontend) can be removed. Each layer deletes its own migration code and specs, and reverts the small edits it made to shared files. The backend also drops the three migration columns from `photos`. The architect removes the migration parts from `docs/agents/`.

## Agents involved

- [backend](backend.md)
- [proxy](proxy.md)
- [frontend](frontend.md)

## Shared contracts

The contract being removed, which all three layers must drop together:

- Frontend → proxy: `POST /migrations/photos?limit=<n>` (issued by `PhotoMigrationClient`) goes away. After this change no rule matches it, so it falls through to the default rules.
- Proxy → backend: `POST /user/photos/migration/prepare` and `PATCH /user/photos/migration` (called by `PhotoMigrationBackendGateway`) are removed, and Rails will return 404 for them.
- DB: `photos.migration_status`, `photos.migration_file_name` and `photos.migration_claimed_at` are dropped. Nothing outside the backend reads them.

These removals are independent, so the three agents can work in parallel. Nothing new is introduced.

## Docs (architect)

Remove the migration parts from `docs/agents/` so the docs describe only the current system, with no history note:

- `docs/agents/specs/photo/rollout.md`: drop ship-order step 4 (**#251** file migration), renumber the later steps (and the "Until step 5" / "after step 5" references), and delete the `## #251: file migration` section.
- `docs/agents/specs/photo/index.md`: in the #336 row, clear the `#251 (file migration)` dependency (replace it with `none`). Drop "#251 migration" from the Rollout bullet.
- `docs/agents/photo_upload/edge-cases-and-coexistence.md`: drop the `#250/#251 — writing and executing the existing-photo-data migration plan.` bullet, and reword the sentence introducing it so it no longer mentions a migration decision.
- `docs/agents/photo_upload/index.md`: drop the "Writing the existing-photo-data migration plan and executing it — that's #250/#251." out-of-scope bullet.
- `docs/agents/summary.md`: update the Rollout row's description so it no longer mentions the #251 file migration.

References to the `ready` column's DB migration in `photo_upload/data-model-and-migration.md` are about schema migrations, not the photo file migration, so leave them unchanged.

## Notes

- The legacy folder and the `photos.oak.ffavs.net` vhost are out of scope. They'll be removed manually on the server.
- Production `configuration/locals.php` may still define `$legacyRoot`. Once no rule reads it, that's a harmless unused variable and can be deleted manually later.
