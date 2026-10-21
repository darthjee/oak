# Login-modal event bus
Create `LoginModalEvents`, a tiny module built on a `window` `CustomEvent`, so any component can
open or close the login modal without prop drilling.

- Event name `oak:login-modal`, dispatched on `window`; `detail` is
  `{ open: boolean, mode: 'password' | 'device' }`.
- `open(mode = 'password')` dispatches `{ open: true, mode }`; an unknown mode falls back to
  `'password'`.
- `close()` dispatches `{ open: false, mode: 'password' }`.
- `subscribe(listener)` adds a `window` listener calling `listener(event.detail)` and returns an
  unsubscribe function that removes it.
- When `window` is undefined, all three are no-ops and `subscribe` returns a no-op unsubscribe.
- Export the event name and the allowed modes as constants for reuse in tests and #397. Add JSDoc
  in the same style as `utils/authState.js`.

Specs: open/close payloads, unknown-mode fallback, subscribe receives details, unsubscribe stops
delivery, and the no-`window` path (temporarily remove/stub `globalThis.window` in the spec, as the
Jasmine run is node-based — check `spec/support` for an existing DOM/window helper first).

## Files to Change
- `frontend/assets/js/utils/LoginModalEvents.js` — new module.
- `frontend/spec/utils/LoginModalEvents_spec.js` — new Jasmine spec.
