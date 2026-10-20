# Send keepSignedIn from LoginModalClient

Change `submit(login, password)` to `submit(login, password, keepSignedIn = false)`. The body
becomes `{ login: { login, password, keepSignedIn: Boolean(keepSignedIn) } }`. Update the JSDoc.

Specs: the body includes `keepSignedIn: true` when `true` is passed, and `false` when the
argument is omitted or falsy.

## Files to Change

- `frontend/assets/js/client/LoginModalClient.js` — the new argument and payload field.
- `frontend/spec/client/LoginModalClient_spec.js` — payload expectations.
