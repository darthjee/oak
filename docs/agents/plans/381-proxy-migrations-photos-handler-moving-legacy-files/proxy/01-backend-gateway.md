# Backend gateway

Create `PhotoMigrationBackendGateway` (same shape as `PhotoDeleteBackendGateway`) with two calls, both forwarding the incoming `Cookie` header when present:

- `prepare(?int $limit, ?string $cookie): Response`: `POST <host>/user/photos/migration/prepare`, appending `?limit=<n>` only when a limit was given.
- `confirm(array $migrated, array $missing, ?string $cookie): Response`: `PATCH <host>/user/photos/migration` with `Content-Type: application/json` and body `json_encode(['migrated' => [...], 'missing' => [...]])`. Always send JSON arrays, even when empty (use `array_values`).

Transport errors surface as a non-2xx `Response` (check what `CurlHttpClient` returns on failure and treat that as a failure in the handler).

## Files to Change

- `proxy/extension/PhotoMigrationBackendGateway.php` — new gateway class.
- `proxy/extension/loader.php` — `require_once` the new file (before the handler).
