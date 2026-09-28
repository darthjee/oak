# Issue: Cleanup — remove photo migration page, endpoints and columns

## Description
Remove the one-off photo migration machinery introduced by #251 (implemented in #380 backend, #381 proxy, #382 frontend) now that every legacy photo has been migrated. The blocking condition is met: every `Oak::Photo` row is `migrated`, with no `pending`, `migrating` or `missing` rows left.

## Problem
The migration flow was only needed to move legacy photo files into the new storage layout. With the migration complete, its page, proxy handler, endpoints and columns are dead code that still has to be maintained, tested and secured.

## Expected Behavior
No migration page, route, header link, proxy rule or backend endpoint remains; the `photos` table no longer carries migration columns; normal photo upload/display keeps working unchanged.

## Solution
- **Frontend:** remove the `#/photos/migration` page (`PhotoMigration`, `PhotoMigrationController`, `PhotoMigrationHelper`), its route in `HashRouteResolver` / `AppHelper`, the header link in `HeaderHelper`, `PhotoMigrationClient`, and their specs.
- **Proxy:** remove the `POST /migrations/photos` rules (`rules/migrations.php` in both `docker_volumes/proxy_configuration` and `proxy/prod_configuration`), `PhotoMigrationRequestHandler`, `PhotoMigrationBatchRunner`, `PhotoMigrationBackendGateway`, `PhotoFileMover`, `PhotoPathGuard` (if unused elsewhere), their loader entries and tests, and the `$legacyRoot` entry from `locals.php.sample` / `configure.php`.
- **Backend:** remove `User::Photos::MigrationsController`, its routes, `Oak::Photo::MigrationDecorator`, `Oak::Photo::MigrationClaimer`, `MIGRATION_CLAIM_TIMEOUT` and their specs. Add a new migration dropping `migration_status`, `migration_file_name` and `migration_claimed_at`; remove the `migration_status` enum, `UUID_FILE_NAME_REGEX` / `Oak::Photo.uuid_file_name?`, and stop setting `migration_status` in `Oak::Photo::CreateBuilder` and `CreateItemPhotosJob`. Keep `Oak::Photo::UniqueFileName` (still used for new uploads).
- **Docs:** remove the migration parts from `docs/agents/` (e.g. `photo_upload/*`, `specs/photo/*`, `summary.md`, `folder-structure.md`) so the docs describe only the current system. Don't leave a history note behind.

Done as a single issue, with the plan split across the backend, proxy and frontend agents.

Out of scope: removing the legacy folder / `photos.oak.ffavs.net` vhost on the server (manual).

## Benefits
Less dead code and surface area across all three layers, a simpler `photos` schema, and no leftover endpoint able to move files on disk.
