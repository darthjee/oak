# Frontend Plan: Keep me signed in for password login

Main plan: [plan.md](plan.md)

## Shared contracts

- `POST /users/login.json` body:
  `{ login: { login, password, keepSignedIn: Boolean(keepSignedIn) } }`. Always send the field.
- The response is unchanged. A `400` (only possible with a malformed flag) falls into the
  existing 4xx "incorrect" branch, which is acceptable because the UI always sends a boolean.

## Steps

- [01 — Send keepSignedIn from LoginModalClient](frontend/01-client-keep-signed-in.md)
- [02 — Track keepSignedIn in LoginModalController](frontend/02-controller-keep-signed-in.md)
- [03 — Render the checkbox in LoginModal and LoginModalHelper](frontend/03-modal-checkbox.md)

## CI Checks

- `frontend`: `yarn lint` (CI job: Check JS Lint). Run the Jasmine suite locally (`yarn test`)
  as well.

## Notes

- #397 adds a device tab that reuses the same checkbox. A small, reusable checkbox element
  (similar to `LabeledInput.jsx`) is welcome but not required.
