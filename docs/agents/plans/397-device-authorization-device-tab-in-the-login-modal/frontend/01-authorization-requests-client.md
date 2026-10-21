# AuthorizationRequestsClient
Create `client/AuthorizationRequestsClient.js`, modelled on `LoginModalClient` (plain `fetch`, no shared
ApiClient). Every call is `POST` with headers `Accept: application/json`,
`Content-Type: application/json`, `X-Skip-Cache: 1`, default same-origin credentials.

- `create(login, keepSignedIn = false)` → `POST /auth/authorization-requests.json` with body
  `{ login, keepSignedIn: Boolean(keepSignedIn) }`. Returns the `Response`.
- `poll(uuid, pollToken)` → `POST /auth/authorization-requests/${encodeURIComponent(uuid)}/poll.json`
  with body `{ pollToken }`. Returns the `Response`.

#398 will add `mine`, `authorize` and `deny`; keep a small private `#post(path, body)` helper so they
are trivial to add.

Spec it like `spec/client/LoginModalClient_spec.js` (`preserveGlobals('fetch')`, `stubFetchResponse`).

## Files to Change
- `frontend/assets/js/client/AuthorizationRequestsClient.js` — new client.
- `frontend/spec/client/AuthorizationRequestsClient_spec.js` — new spec (URLs, headers, bodies, `keepSignedIn` coercion).
