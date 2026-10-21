# Extend AuthorizationRequestsClient
Add the approver methods, reusing the private `#post` (so `X-Skip-Cache: 1` is sent) and
returning the raw `Response`, like `create`/`poll`:

- `mine()` → `POST /auth/authorization-requests/mine.json` with `{}`.
- `authorize(uuid, password)` → `POST /auth/authorization-requests/${encodeURIComponent(uuid)}/authorize.json` with `{ password }`.
- `deny(uuid)` → `POST /auth/authorization-requests/${encodeURIComponent(uuid)}/deny.json` with `{}`.

Add JSDoc matching the existing methods and Jasmine specs (stub `fetch`, assert path, method,
headers and body, including uuid encoding).

## Files to Change
- `frontend/assets/js/client/AuthorizationRequestsClient.js` — add `mine`, `authorize`, `deny`.
- `frontend/spec/client/AuthorizationRequestsClient_spec.js` — specs for the three methods.
