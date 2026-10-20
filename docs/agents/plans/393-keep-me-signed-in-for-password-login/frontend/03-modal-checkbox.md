# Render the checkbox in LoginModal and LoginModalHelper

`LoginModal.jsx`:

- Add `const [keepSignedIn, setKeepSignedIn] = useState(false)` and pass the setter to the
  controller.
- Pass `keepSignedIn` in `state`, and an `onKeepSignedInChange` handler
  (`event => setKeepSignedIn(event.target.checked)`).
- `handleSubmit` calls `controller.handleSubmit(login, password, keepSignedIn)`.

`LoginModalHelper.render`:

- Below the password input, render a Bootstrap checkbox (`form-check` / `form-check-input` /
  `form-check-label`) with id `keepSignedIn` and the label **"Keep me signed in"**.
- It is `checked={state.keepSignedIn}` and `onChange={handlers.onKeepSignedInChange}`.
- Update the JSDoc for the state and handlers.

Specs:

- the helper renders the checkbox, reflects its state, and wires `onChange`;
- `LoginModal` submits with the checkbox value.

## Files to Change

- `frontend/assets/js/components/elements/LoginModal.jsx` — state, handler and submit.
- `frontend/assets/js/components/elements/helpers/LoginModalHelper.jsx` — the checkbox markup.
- `frontend/spec/components/elements/helpers/LoginModalHelper_spec.js` — rendering and handler.
- `frontend/spec/components/elements/LoginModal_spec.js` — submit includes the flag.
