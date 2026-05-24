# Plan: Add Login

## Overview

Add login/logoff capability to the React front-end. A new `LoginModal` element handles the
credentials form and the `POST /users/login.json` call. The `Header` gains a `refreshKey`
counter so login/logoff events force it to re-fetch subscriptions and logged state without a
full page reload.

Sub-issue of [#92 — Use React Front-End](../../issues/92-used-react-front-end.md).
Depends on [#94 — Build Header](../../issues/94-build-header.md) (Header must exist first).

---

## Context

Relevant API endpoints:

| Action | Method | URL |
|--------|--------|-----|
| Check login | `GET` | `/users/login.json` |
| Submit login | `POST` | `/users/login.json` |
| Logoff | `DELETE` | `/users/logoff.json` |

The `POST /users/login.json` body: `{ login: "username", password: "password" }`.

On success the server returns the logged-in user data.
On wrong credentials it returns a 4xx with an error payload.
On unexpected error (5xx) the modal shows a generic message.

The "reload header" problem: after login/logoff the header must re-run its `useEffect` to
re-fetch `GET /users/login.json` and `GET /user/categories.json`. This is solved with a
`refreshKey` integer in `Header.jsx` state — incrementing it adds it to the `useEffect`
dependency array and triggers a re-fetch.

---

## Implementation Steps

### Step 1 — `LoginModalController.jsx`

Create `frontend/assets/js/components/elements/controllers/LoginModalController.jsx`.

Plain JS class. Constructor receives `setLogin`, `setPassword`, `setIncorrect`, `setError`,
`onSuccess`.

Methods:

- `handleSubmit()` — `POST /users/login.json` with `{ login, password }`:
  - On success: calls `onSuccess()` (header reloads + modal closes)
  - On 401/wrong credentials: calls `setIncorrect(true)`
  - On other errors: calls `setError(true)`
- `handleClear()` — resets `login`, `password`, `incorrect`, `error` to defaults

### Step 2 — `LoginModalHelper.jsx`

Create `frontend/assets/js/components/elements/helpers/LoginModalHelper.jsx`.

Static class. `render(state, handlers)`:

Returns a `react-bootstrap` `<Modal>` containing:

- `<Modal.Header>` with close button (calls `handlers.onClose`)
- `<Modal.Body>`:
  - Alert `danger` shown when `state.incorrect` — "Username or password incorrect."
  - Alert `danger` shown when `state.error` — "An unexpected error occurred, please try again later."
  - Username `<input>` bound to `state.login`
  - Password `<input type="password">` bound to `state.password`
- `<Modal.Footer>`:
  - "Cancel" button — calls `handlers.onClear` then `handlers.onClose`
  - "Login" submit button — calls `handlers.onSubmit`

### Step 3 — `LoginModal.jsx`

Create `frontend/assets/js/components/elements/LoginModal.jsx`.

Receives props: `show`, `onClose`, `onSuccess`.

```jsx
function LoginModal({ show, onClose, onSuccess }) {
  const [login, setLogin]         = useState('');
  const [password, setPassword]   = useState('');
  const [incorrect, setIncorrect] = useState(false);
  const [error, setError]         = useState(false);

  const controller = new LoginModalController(
    setLogin, setPassword, setIncorrect, setError, onSuccess
  );

  const state    = { login, password, incorrect, error };
  const handlers = {
    onSubmit: () => controller.handleSubmit(login, password),
    onClear:  () => controller.handleClear(),
    onClose,
  };

  return LoginModalHelper.render(show, state, handlers);
}
```

### Step 4 — Update `Header.jsx`

Add `showModal` and `refreshKey` to state:

```jsx
const [showModal, setShowModal] = useState(false);
const [refreshKey, setRefreshKey] = useState(0);

const controller = new HeaderController(setLogged, setCategories, setLoading, setError, setRefreshKey);

useEffect(controller.buildEffect(), [refreshKey]);
```

Pass `showModal`, `setShowModal`, and a `handleAuthChange` callback to the helper.

### Step 5 — Update `HeaderController.jsx`

Add a `handleLogoff()` method:

```js
handleLogoff() {
  fetch('/users/logoff.json', { method: 'DELETE' })
    .finally(() => this.#setRefreshKey(k => k + 1));
}
```

The `buildEffect()` signature stays the same — `refreshKey` is in the `useEffect` deps in the
component, not passed to the controller.

### Step 6 — Update `HeaderHelper.jsx`

Update `render(logged, categories, showModal, handlers)`:

- "Login" link: `onClick={handlers.onLoginClick}` (sets `showModal(true)`)
- "Logoff" link: `onClick={handlers.onLogoff}`
- Render `<LoginModal show={showModal} onClose={handlers.onCloseModal} onSuccess={handlers.onAuthSuccess} />`
  below the navbar

`onAuthSuccess` increments `refreshKey` and closes the modal.

### Step 7 — Tests

| Spec file | What it tests |
|-----------|---------------|
| `spec/components/elements/controllers/LoginModalController_spec.js` | `handleSubmit` on success calls `onSuccess`; on 401 sets `incorrect`; on 5xx sets `error`; `handleClear` resets all state |
| `spec/components/elements/helpers/LoginModalHelper_spec.js` | Modal renders with correct fields; error alerts shown/hidden; buttons call correct handlers |
| `spec/components/elements/LoginModal_spec.js` | Passes correct state and handlers to helper; renders loading/error/success states |
| `spec/components/elements/controllers/HeaderController_spec.js` | Update — `handleLogoff` calls DELETE endpoint and increments refreshKey |
| `spec/components/elements/helpers/HeaderHelper_spec.js` | Update — Login link calls `onLoginClick`; Logoff calls `onLogoff`; `<LoginModal>` is rendered |
| `spec/components/elements/Header_spec.js` | Update — `refreshKey` in useEffect deps; `showModal` state wired correctly |

---

## Files to Create / Change

| File | Action |
|------|--------|
| `frontend/assets/js/components/elements/LoginModal.jsx` | Create |
| `frontend/assets/js/components/elements/controllers/LoginModalController.jsx` | Create |
| `frontend/assets/js/components/elements/helpers/LoginModalHelper.jsx` | Create |
| `frontend/assets/js/components/elements/Header.jsx` | Update — add `showModal`, `refreshKey` |
| `frontend/assets/js/components/elements/controllers/HeaderController.jsx` | Update — add `handleLogoff` |
| `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` | Update — wire Login/Logoff handlers, render `<LoginModal>` |
| `spec/components/elements/LoginModal_spec.js` | Create |
| `spec/components/elements/controllers/LoginModalController_spec.js` | Create |
| `spec/components/elements/helpers/LoginModalHelper_spec.js` | Create |
| `spec/components/elements/Header_spec.js` | Update |
| `spec/components/elements/controllers/HeaderController_spec.js` | Update |
| `spec/components/elements/helpers/HeaderHelper_spec.js` | Update |

---

## Notes

- The `refreshKey` pattern avoids global state (no Context or Redux needed) while cleanly
  triggering re-fetches. Every increment re-runs the `useEffect` in `Header`.
- The `LoginModal` is self-contained — it manages its own form state internally and exposes
  only `show`, `onClose`, and `onSuccess` as props, keeping the Header lean.
- After logoff, `handleLogoff` always increments `refreshKey` (in `finally`) so the header
  updates even if the server returns an error.
- Verify CSRF token handling for `POST` and `DELETE` requests — Rails requires a CSRF token by
  default. May need to read it from the `<meta name="csrf-token">` tag or configure Rails to
  skip CSRF for JSON API endpoints.

## CI Checks

Before opening a PR, run the following for the `frontend/` folder:

- `frontend/`: `docker-compose exec oak_fe npm test` (CircleCI job: `jasmine`)
- `frontend/`: `docker-compose exec oak_fe npm run lint` (CircleCI job: `frontend-checks`)
