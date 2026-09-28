# Add PhotoMigrationClient
Create `PhotoMigrationClient` next to `PhotoUploadClient`, with a single `migrate(limit)` method:

- `fetch('/migrations/photos?limit=' + limit, { method: 'POST', headers: { Accept: 'application/json' }, credentials: 'same-origin' })`.
- Add `X-Skip-Cache: 1` when logged in, mirroring `PhotoUploadClient#skipCacheHeader`, so the request is never served from a cache.
- On `response.ok`, resolve with `response.json()`.
- Otherwise, throw an `Error` that carries `status` (e.g. `error.status = response.status`), so the controller can show a login-specific message on 401/403 and a generic one for everything else (including 502).

Add Jasmine specs mirroring `PhotoUploadClient_spec.js`:
- method, URL and limit;
- the header when logged in and when not;
- the parsed body on 200;
- a thrown error carrying the status on 401, 403 and 502.

## Files to Change
- `frontend/assets/js/client/PhotoMigrationClient.js` — new client.
- `frontend/spec/client/PhotoMigrationClient_spec.js` — new specs.
