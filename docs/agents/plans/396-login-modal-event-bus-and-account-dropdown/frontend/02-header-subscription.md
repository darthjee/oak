# Header subscribes to the bus
Make Header the only listener of `LoginModalEvents`.

- `HeaderController`: accept two more setters, `setShowModal` and `setModalMode` (append them as
  constructor params before the optional `client`, updating `Header.jsx` and existing specs), and
  add `buildModalEffect()` returning an effect that subscribes to `LoginModalEvents` and returns
  the unsubscribe. On `open: true`: if `isLoggedIn()` (from `utils/authState.js`) is true, keep
  `showModal` false and do nothing else; otherwise set the mode to `detail.mode` and
  `showModal = true`. On `open: false`: `showModal = false`.
- `Header.jsx`: add `modalMode` state (default `'password'`), pass the new setters to the
  controller, and run `controller.buildModalEffect()` in its own `useEffect` keyed on
  `[controller]`. The Login link handler sends `LoginModalEvents.open('password')`;
  `onCloseModal` and `onAuthSuccess` keep setting `showModal` to false directly. Pass `modalMode`
  to the helper (e.g. as `handlers.modalMode`).

Specs (`HeaderController_spec`): open while logged out shows the modal with the given mode; open
while logged in is ignored; close hides it; the cleanup unsubscribes (no calls after cleanup).

## Files to Change
- `frontend/assets/js/components/elements/controllers/HeaderController.js` — new setters and
  `buildModalEffect()`.
- `frontend/assets/js/components/elements/Header.jsx` — `modalMode` state, second effect, Login
  link uses the bus, pass `modalMode`.
- `frontend/spec/components/elements/controllers/HeaderController_spec.js` — cover the modal effect;
  adjust constructor calls.
