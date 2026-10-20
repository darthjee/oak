# Track keepSignedIn in LoginModalController

- Add a `setKeepSignedIn` state setter to the constructor, placed after `setPassword` (update
  `LoginModal.jsx` and the specs/factories accordingly).
- `handleSubmit(login, password, keepSignedIn)` forwards the value to
  `client.submit(login, password, keepSignedIn)`.
- `handleClear()` also calls `setKeepSignedIn(false)`, so the checkbox resets on close/cancel and
  after a successful login.
- A failed login keeps the checkbox as it is; only the password is cleared, as today.

Specs:

- the value is forwarded to the client;
- clearing resets it;
- the failure paths leave it untouched.

## Files to Change

- `frontend/assets/js/components/elements/controllers/LoginModalController.js` — the setter,
  forwarding and reset.
- `frontend/spec/components/elements/controllers/LoginModalController_spec.js` — new
  expectations.
- `frontend/spec/support/factories.js` — only if it builds the controller or the modal state.
