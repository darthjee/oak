# PHPUnit specs

Add specs using `FakeHttpClient` and temp directories, following the `PhotoDelete*` test cases (silence `error_log`, build files under a temp `storageRoot`/`legacyRoot`).

- `PhotoMigrationBackendGatewayTest`:
  - `prepare` URL, with and without `limit`;
  - Cookie forwarded;
  - `confirm` method, URL, JSON body and content type.
- `PhotoFileMoverTest`:
  - full move of both kinds (target dirs created);
  - resume, with both files already at the target;
  - mixed case: one kind already moved, the other still at legacy;
  - partial legacy (one kind absent everywhere) → `missing`, and nothing moved;
  - rename/mkdir failure (for example a read-only target dir) → `failed`.
- Path validation tests:
  - valid names with spaces/accents pass;
  - rejected: `..`, NUL, absolute paths, a wrong prefix, an empty file name, extra segments.
- `PhotoMigrationRequestHandlerTest`:
  - `prepare` `401` relayed, with no file touched and no `PATCH`;
  - invalid backend JSON → `502`;
  - invalid path → `failed`, with no file touched;
  - `PATCH` payload holds the migrated/missing ids;
  - `PATCH` skipped when there are no migrated/missing ids (all failed, and empty batch);
  - `PATCH` failure → `502`;
  - response shape, including `remaining` adjustment and flooring at 0;
  - `legacyRoot` distinct from `storageRoot` (moves across roots).
- `ProdConfigurationRoutingTest`:
  - add `migrations` to `RULE_FILES` in `configure.php` order and supply `legacyRoot` in the locals;
  - bump the rule count and index assertions;
  - assert `POST /migrations/photos?limit=5` routes to `PhotoMigrationRequestHandler`;
  - add a test that the rule still builds when `$legacyRoot` is undefined (fallback to `$storageRoot`) if feasible, or cover it via a separate include.

## Files to Change

- `proxy/extension_tests/PhotoMigrationBackendGatewayTest.php` — new.
- `proxy/extension_tests/PhotoFileMoverTest.php` — new.
- `proxy/extension_tests/PhotoPathGuardTest.php` (or a validator test) — new or extended.
- `proxy/extension_tests/PhotoMigrationRequestHandlerTest.php` (plus a test case base if useful) — new.
- `proxy/extension_tests/ProdConfigurationRoutingTest.php` — route the new rule.
