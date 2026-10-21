# Stable controller with modes and device submit
Extend `LoginModalController` so it is created once per modal (step 06 uses `useMemo(..., [])`) and
owns the poller.

- Constructor: switch to a setters object to keep it readable, e.g.
  `new LoginModalController({ setLogin, setPassword, setKeepSignedIn, setIncorrect, setError, setMode, setPanel, setSubmitError, setNetworkError, setExpiresAt }, { onSuccess, client, requestsClient, poller })`.
  Default `client = new LoginModalClient()`, `requestsClient = new AuthorizationRequestsClient()`,
  `poller = new AuthorizationRequestPoller({ client: requestsClient, onApproved, onFinal, onNetworkError })`.
- `setOnSuccess(fn)` — updated by the component each render, since the controller is memoized and the
  Header's callback may change. `#succeed()` calls the current `onSuccess`.
- `handleClear()` — clears all fields and errors, panel → `'form'`, `networkError` false,
  `expiresAt` null, and stops the poller.
- `switchMode(mode)` — normalizes the mode (`MODE_PASSWORD`/`MODE_DEVICE` from `LoginModalEvents`,
  unknown → password), calls `handleClear()`, then `setMode(mode)`. "Try again" calls
  `switchMode(MODE_DEVICE)`.
- `handleSubmit(login, password, keepSignedIn)` — password flow unchanged.
- `handleDeviceSubmit(login, keepSignedIn)` — clear `submitError`; `requestsClient.create`; on
  non-OK set `submitError` to the JSON `message` or a generic message (no poller); on network error
  generic message; on OK parse `{ uuid, pollToken, expiresAt }`, `setExpiresAt(expiresAt)`,
  `setPanel('waiting')`, `poller.start(...)`.
- Poller callbacks: `onApproved` → `handleClear()` then `#succeed()`; `onFinal(panel)` →
  `setNetworkError(false)`, `setPanel(panel)`; `onNetworkError(flag)` → `setNetworkError(flag)`.
- `stop()` — stops the poller (used on close, unmount, `pagehide`).

Update `LoginModalController_spec.js` for the new constructor and add specs for every method above,
injecting spy clients and a fake poller.

## Files to Change
- `frontend/assets/js/components/elements/controllers/LoginModalController.js` — modes, device submit, poller ownership, `setOnSuccess`, `stop`.
- `frontend/spec/components/elements/controllers/LoginModalController_spec.js` — updated and extended.
