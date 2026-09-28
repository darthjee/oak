# Proxy Plan: Cleanup — remove photo migration page, endpoints and columns

Main plan: [plan.md](plan.md)

## Shared contracts

- Remove the `POST /migrations/photos` rule in both dev and prod configs. The frontend stops calling it in the same change.
- Stop calling the backend's `POST /user/photos/migration/prepare` and `PATCH /user/photos/migration`, which are removed in the same change.

## Implementation Steps

### Step 1 — Remove the migration rules and config
Delete the `migrations.php` rule files and their `require_once` lines in both configs. Remove `$legacyRoot` from `locals.php.sample` and from the host-specific values comment in `prod_configuration/configure.php`.

### Step 2 — Remove the migration extension classes and tests
Delete the migration-only extension classes, their loader entries and their tests. Revert `ProdConfigurationRoutingTest` to the pre-#381 rule layout, which has no migrations rule: `RULE_FILES` without `'migrations'`, `assertCount(9, ...)`, backend JSON at index 6 and redirects at index 7. Remove the migration assertions, `LEGACY_ROOT` / `MIGRATION_PATH`, `assertMigrationHandler`, the `$legacyRoot` fallback test and `'legacyRoot'` in `prodLocals()`, but keep the `prodLocals()` / `includeRuleFile` helpers if other tests still use them.

**Keep** `PhotoPathGuard` and `PhotoPathGuardTest`. `PhotoSubmitRequestHandler`, `PhotoDeleteRequestHandler`, `PhotoFileDeleter` and `PhotoVersionStorer` all use it now.

## Files to Change
- `docker_volumes/proxy_configuration/rules/migrations.php` — delete.
- `docker_volumes/proxy_configuration/configure.php` — remove `require_once __DIR__ . '/rules/migrations.php';`.
- `proxy/prod_configuration/rules/migrations.php` — delete.
- `proxy/prod_configuration/configure.php` — remove the `migrations.php` require, and remove `$legacyRoot` from the locals comment.
- `proxy/prod_configuration/locals.php.sample` — remove the `$legacyRoot` block and its comment.
- `proxy/extension/PhotoMigrationRequestHandler.php`, `PhotoMigrationBatchRunner.php`, `PhotoMigrationBackendGateway.php`, `PhotoFileMover.php` — delete.
- `proxy/extension/loader.php` — remove the four `require_once` lines for those files.
- `proxy/extension_tests/PhotoMigrationRequestHandlerTest.php`, `PhotoMigrationRequestHandlerBatchTest.php`, `PhotoMigrationRequestHandlerTestCase.php`, `PhotoMigrationBackendGatewayTest.php`, `PhotoMigrationTestCase.php`, `PhotoFileMoverTest.php` — delete.
- `proxy/extension_tests/ProdConfigurationRoutingTest.php` — revert to the rule layout without the migrations rule, as described above.

## CI Checks
- `proxy`: `vendor/bin/phpunit` inside `darthjee/tent-test:1.0.0` (CI job: `proxy-tests`)

## Notes
- Before deleting each `PhotoMigration*TestCase` base class, grep for other users. None are expected outside the migration tests.
