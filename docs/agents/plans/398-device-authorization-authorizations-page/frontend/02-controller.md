# AuthorizationsController
Create `AuthorizationsController extends BasePageController`, constructed with the page's state
setters (requests, loading, page error, per-uuid row state) and an optional injected
`AuthorizationRequestsClient` (default `new AuthorizationRequestsClient()`).

Behavior:
- `buildEffect()` loads the list on mount (mounted guard via `buildSafeSetter`, cleanup on unmount).
- `refresh()` reloads the list (clears the page error first). No automatic polling.
- Load: `mine()`; `200` → set `requests` (default `[]`); `401` → handle session expiry; any other
  status or network failure → page-level error (`message` from body when present, otherwise a
  generic text). Loading flag cleared in `finally`.
- Row state kept per `uuid`: `{ formOpen, password, error, submitting }`. Methods:
  `openAuthorize(uuid)`, `closeAuthorize(uuid)` (optional cancel), `setPassword(uuid, value)`,
  `authorize(uuid)`, `deny(uuid)`.
- `authorize`/`deny` success (`2xx`) → clear that row's state/error and `refresh()`.
- `400` → set the row error to the response's `message`; the row stays. For `authorize`, keep the
  form open and clear the password.
- `401` from any call → `setLoggedIn(false)` then `LoginModalEvents.open(MODE_PASSWORD)`; no page or
  row error, list left untouched.
- Other failures on row actions → generic row error.

Specs cover: load success/empty/error/401; refresh; authorize success/400/401; deny
success/400/401; unmount guard; password cleared on 400.

## Files to Change
- `frontend/assets/js/components/pages/controllers/AuthorizationsController.js` — new controller.
- `frontend/spec/components/pages/controllers/AuthorizationsController_spec.js` — new specs.
