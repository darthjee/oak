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

### Step 1 — `LoginModalController.js`

Create `frontend/assets/js/components/elements/controllers/LoginModalController.js`
(plain `.js`, not `.jsx` — controllers follow the `.js` convention, e.g. `HeaderController.js`).

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

Static class. `render(show, state, handlers)`:

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

### Step 4 — Update `Header.js`

> **Already implemented:** `Header.js` already passes `controller.handleLogoff` to
> `HeaderHelper.render` and uses `useMemo` + `useEffect(() => { return effect(); }, [controller])`.

Add `showModal` and `refreshKey` to the existing state block:

```jsx
const [showModal, setShowModal]   = useState(false);
const [refreshKey, setRefreshKey] = useState(0);
```

Pass `setRefreshKey` to the controller constructor (see Step 5), add `refreshKey` to the
`useEffect` dependency array so the header re-fetches after login/logoff, and pass
`showModal` + modal handlers to `HeaderHelper.render`:

```jsx
const controller = useMemo(
  () => new HeaderController(setLogged, setCategories, setLoading, setError, setRefreshKey),
  []
);

useEffect(() => {
  const effect = controller.buildEffect();
  return effect();
}, [controller, refreshKey]);

// ...

return HeaderHelper.render(logged, categories, {
  onLogoff:     controller.handleLogoff,
  onLoginClick: () => setShowModal(true),
  onCloseModal: () => setShowModal(false),
  onAuthSuccess: () => { setRefreshKey(k => k + 1); setShowModal(false); },
  showModal,
});
```

### Step 5 — Update `HeaderController.js`

> **Already implemented:** `HeaderController.js` already has `handleLogoff()` — it calls
> `this.client.logoff()` then re-fetches categories via `#fetchCategories` and sets
> `logged = false`.

Add a `setRefreshKey` constructor parameter and store it. Then update `#handleLogoffSuccess`
to increment `refreshKey` instead of (or in addition to) re-fetching categories directly,
so the `useEffect` in `Header.js` re-runs and reloads both login status and categories:

```js
constructor(setLogged, setCategories, setLoading, setError, setRefreshKey = null, client = new HeaderClient()) {
  // ...
  this.setRefreshKey = setRefreshKey;
}

#handleLogoffSuccess() {
  this.setLogged(false);
  if (this.setRefreshKey) {
    this.setRefreshKey(k => k + 1);
  } else {
    this.#fetchCategories(this.#unsafeSet.bind(this));
  }
}
```

The `buildEffect()` signature does not change — `refreshKey` lives in the component's
`useEffect` dep array, not inside the controller.

### Step 6 — Update `HeaderHelper.jsx`

> **Already implemented:** `HeaderHelper.jsx` already renders "Login" and "Logoff" links and
> passes `onLogoff` to the Logoff anchor. The Login link currently uses Bootstrap's
> `data-bs-toggle='modal'` attribute to open a server-rendered modal.

Change `render` to accept a `handlers` object (see Step 4):

```js
static render(logged, categories, handlers) { ... }
```

In `#renderAuth`:
- Replace the `data-bs-toggle` / `data-bs-target` attributes on the Login anchor with
  `onClick={handlers.onLoginClick}`.
- Render `<LoginModal show={handlers.showModal} onClose={handlers.onCloseModal} onSuccess={handlers.onAuthSuccess} />`
  outside the `<ul>` (or at the bottom of the shell) so the modal can overlay the full page.

The Logoff link already calls `onLogoff` via `onClick` — no change needed there.

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
| `frontend/assets/js/components/elements/controllers/LoginModalController.js` | Create |
| `frontend/assets/js/components/elements/helpers/LoginModalHelper.jsx` | Create |
| `frontend/assets/js/components/elements/Header.js` | Update — add `showModal`, `refreshKey`; pass `setRefreshKey` to controller; update `useEffect` deps |
| `frontend/assets/js/components/elements/controllers/HeaderController.js` | Update — add `setRefreshKey` param; update `#handleLogoffSuccess` to increment key |
| `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` | Update — accept `handlers` object; replace `data-bs-toggle` with `onClick`; render `<LoginModal>` |
| `spec/components/elements/LoginModal_spec.js` | Create |
| `spec/components/elements/controllers/LoginModalController_spec.js` | Create |
| `spec/components/elements/helpers/LoginModalHelper_spec.js` | Create |
| `spec/components/elements/Header_spec.js` | Update — cover `showModal` state and `refreshKey` in `useEffect` deps |
| `spec/components/elements/controllers/HeaderController_spec.js` | Update — cover `setRefreshKey` incremented on logoff |
| `spec/components/elements/helpers/HeaderHelper_spec.js` | Update — Login link calls `onLoginClick`; `<LoginModal>` rendered; no `data-bs-toggle` |

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
