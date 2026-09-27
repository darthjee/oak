# Migration request handler

Create `PhotoMigrationRequestHandler extends RequestHandler`, using the `PhotoRequestHandlerHelpers` trait. Its constructor takes `(string $host, string $storageRoot, string $legacyRoot, ?HttpClientInterface $httpClient = null)`. `build()` reads `host`, `storageRoot` and `legacyRoot`, defaulting to `/tmp/photos`.

`processsRequest()`:

1. Read `limit` from the request query (via the Tent `RequestInterface` query accessor; check the vendored interface in the tent-test image) and cast it to an int if numeric. Read `Cookie` via `headerValue`.
2. `$gateway->prepare(...)`. Non-2xx → return that response unchanged.
3. Decode the body. If it is not an object with an array `photos` and an int `remaining` → `errorResponse(502, 'Invalid response from backend')`.
4. For each photo entry:
   - no int `id` → skip it (log);
   - `legacy_path`/`file_path` missing, not a string, or failing path validation → add to `failed`, reason `invalid path`;
   - otherwise call `PhotoFileMover::migrate` and put the id into `migrated`, `missing` or `failed` (with the reason).
5. If `migrated` or `missing` is non-empty → `$gateway->confirm(migrated, missing, cookie)`. A non-2xx result → `errorResponse(502, 'Failed to confirm migration')`. Both lists empty → skip the `PATCH`.
6. Respond `200`, `Content-Type: application/json`, with body `{"migrated": count(migrated), "missing": [ids], "failed": [{"id","reason"}], "remaining": max(0, remaining - count(migrated) - count(missing))}`.

Keep the class small (PHPMD/Codacy): move the per-photo classification into a private method or a small collaborator if needed.

## Files to Change

- `proxy/extension/PhotoMigrationRequestHandler.php` — new handler.
- `proxy/extension/loader.php` — `require_once` the handler (after its dependencies).
