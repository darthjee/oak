# Plan: Build Header

## Overview

Build the navigation header as a React element following the three-layer component pattern
(`Header` / `HeaderController` / `HeaderHelper`). The header checks login status and fetches
subscribed categories on mount, then renders a Bootstrap navbar with a Categories dropdown and
Login/Logoff links.

Sub-issue of [#92 — Use React Front-End](../../issues/92-used-react-front-end.md).
Depends on [#93 — Add Separated Front-End Builder](../../issues/93-add-separated-front-end-builder.md)
(frontend scaffold must exist first).

---

## Context

The existing AngularJS header (`source/app/views/layouts/_header.html.erb`) uses
`ng-controller="Global.HeaderController"` to check login state and
`ng-controller="Menu.Controller"` to list subscribed categories in a dropdown.

The new React header must replicate this behaviour:

| Behaviour | API endpoint |
|-----------|--------------|
| Check login status | `GET /users/login.json` |
| Fetch subscribed categories | `GET /user/categories.json` |

---

## Implementation Steps

### Step 1 — `HeaderController.jsx`

Create `frontend/assets/js/components/elements/controllers/HeaderController.jsx`.

Plain JS class. Constructor receives `setLogged`, `setCategories`, `setLoading`.

- `buildEffect()` — returns a function that:
  1. Fetches `GET /users/login.json` and sets `logged` state from the response
  2. Fetches `GET /user/categories.json` and sets `categories` state from the response
  3. Sets `loading` to `false` in a `finally` block
  4. Handles errors and sets an `error` state

### Step 2 — `HeaderHelper.jsx`

Create `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx`.

Static class with methods:

- `renderLoading()` — returns a spinner or placeholder navbar
- `renderError(error)` — returns a minimal navbar with an error message
- `render(logged, categories)` — returns the full Bootstrap navbar:
  - Brand link "Oak" pointing to `/#/`
  - Collapsible navbar with:
    - **Categories dropdown**: "New" link (logged-in only), "All" link, one link per category
    - **Login/Logoff** toggle: shows "Login" when not logged in, "Logoff" when logged in

### Step 3 — `Header.jsx`

Create `frontend/assets/js/components/elements/Header.jsx`.

Thin component:

```jsx
function Header() {
  const [logged, setLogged] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const controller = new HeaderController(setLogged, setCategories, setLoading, setError);

  useEffect(controller.buildEffect(), []);

  if (loading) return HeaderHelper.renderLoading();
  if (error)   return HeaderHelper.renderError(error);

  return HeaderHelper.render(logged, categories);
}
```

### Step 4 — Wire into `App.jsx`

Update `frontend/assets/js/components/App.jsx` to render `<Header />` at the top of the page,
above the page routing placeholder.

### Step 5 — Tests

Create Jasmine specs mirroring the source structure:

| Spec file | What it tests |
|-----------|---------------|
| `spec/components/elements/Header_spec.js` | Renders loading, error, and full navbar states |
| `spec/components/elements/controllers/HeaderController_spec.js` | `buildEffect` fetches both endpoints and calls setters |
| `spec/components/elements/helpers/HeaderHelper_spec.js` | Each static render method returns expected JSX structure |

---

## Files to Create / Change

| File | Action |
|------|--------|
| `frontend/assets/js/components/elements/Header.jsx` | Create |
| `frontend/assets/js/components/elements/controllers/HeaderController.jsx` | Create |
| `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` | Create |
| `frontend/assets/js/components/App.jsx` | Update — add `<Header />` |
| `spec/components/elements/Header_spec.js` | Create |
| `spec/components/elements/controllers/HeaderController_spec.js` | Create |
| `spec/components/elements/helpers/HeaderHelper_spec.js` | Create |

---

## Notes

- The login modal itself is out of scope for this issue (separate issue per #94 description).
- The `GET /users/login.json` route is `check` action inside `resources :login` under the
  `users` collection — verify the exact response shape before implementing the controller.
- The `GET /user/categories.json` route is under the `user` namespace — confirm the JSON
  shape returned by the decorator before implementing.
- Bootstrap 5 is available via `react-bootstrap`; prefer `react-bootstrap` components over raw
  HTML where convenient, but keep parity with the existing navbar structure.
- Both API calls can be made in parallel using `Promise.all` inside `buildEffect`.

## CI Checks

Before opening a PR, run the following for the `frontend/` folder:

- `frontend/`: `docker-compose exec oak_fe npm test` (CircleCI job: `jasmine`)
- `frontend/`: `docker-compose exec oak_fe npm run lint` (CircleCI job: `frontend-checks`)
