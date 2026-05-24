# Plan: Build Index Categories Page

## Overview

Build the categories index page as a React `Pages` component following the three-layer pattern
(`Categories` / `CategoriesController` / `CategoriesHelper`). The page fetches
`GET /categories.json` and renders each result as a Bootstrap card. Register the route
`/#/categories` in `App.jsx`.

Sub-issue of [#92 — Use React Front-End](../../issues/92-used-react-front-end.md).
Depends on [#93 — Add Separated Front-End Builder](../../issues/93-add-separated-front-end-builder.md)
(frontend scaffold must exist first).

---

## Context

The existing AngularJS template is at `source/app/views/categories/_index.html.erb`.

`GET /categories.json` returns an array of category objects:

```json
[
  { "name": "Project", "slug": "project", "snap_url": "http://photos.oak.ffavs.net/snaps/..." }
]
```

Each card links to `/#/categories/:slug/items` (the items index page, added in a future issue).

A "New" button is shown at the top when the user is logged in. The `logged` state comes from the
global auth context shared with the `Header` component (see issue #94). If auth context is not
yet available when this issue is implemented, the "New" button can be driven by a local
`GET /users/login.json` call inside `CategoriesController`, following the same pattern as the
Header.

---

## Implementation Steps

### Step 1 — `CategoriesController.jsx`

Create `frontend/assets/js/components/pages/controllers/CategoriesController.jsx`.

Plain JS class. Constructor receives `setCategories`, `setLogged`, `setLoading`, `setError`.

- `buildEffect()` — returns a function that:
  1. Fetches `GET /categories.json` and calls `setCategories` with the response data
  2. Fetches `GET /users/login.json` and calls `setLogged` with the result
  3. Calls `setLoading(false)` in a `finally` block
  4. Catches errors and calls `setError`

Both fetches can run in parallel via `Promise.all`.

### Step 2 — `CategoriesHelper.jsx`

Create `frontend/assets/js/components/pages/helpers/CategoriesHelper.jsx`.

Static class:

- `renderLoading()` — returns a spinner placeholder
- `renderError(error)` — returns an error alert
- `render(categories, logged)` — returns:
  - A "New" button (`href="/#/categories/new"`) shown only when `logged` is `true`
  - A Bootstrap `.row` grid of cards, one per category:
    - Card body with an `<a href={/#/categories/${slug}/items}>` wrapping:
      - `<h5>` with the category name
      - `<img>` with `snap_url` (Bootstrap `img-fluid` classes)

### Step 3 — `Categories.jsx`

Create `frontend/assets/js/components/pages/Categories.jsx`.

```jsx
function Categories() {
  const [categories, setCategories] = useState([]);
  const [logged, setLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const controller = new CategoriesController(setCategories, setLogged, setLoading, setError);

  useEffect(controller.buildEffect(), []);

  if (loading) return CategoriesHelper.renderLoading();
  if (error)   return CategoriesHelper.renderError(error);

  return CategoriesHelper.render(categories, logged);
}
```

### Step 4 — Register route in `App.jsx`

Update `frontend/assets/js/components/App.jsx` to route `/#/categories` to `<Categories />`.

Since the project uses hash-based routing (no React Router yet at this stage), a simple
conditional on `window.location.hash` is sufficient, or install `react-router-dom` if it is
already a dependency by then.

### Step 5 — Tests

| Spec file | What it tests |
|-----------|---------------|
| `spec/components/pages/controllers/CategoriesController_spec.js` | `buildEffect` fetches `/categories.json` and `/users/login.json`, calls all setters correctly |
| `spec/components/pages/helpers/CategoriesHelper_spec.js` | `render` produces correct card structure; "New" button shown/hidden based on `logged` |
| `spec/components/pages/Categories_spec.js` | Renders loading, error, and populated states |

---

## Files to Create / Change

| File | Action |
|------|--------|
| `frontend/assets/js/components/pages/Categories.jsx` | Create |
| `frontend/assets/js/components/pages/controllers/CategoriesController.jsx` | Create |
| `frontend/assets/js/components/pages/helpers/CategoriesHelper.jsx` | Create |
| `frontend/assets/js/components/App.jsx` | Update — register `/#/categories` route |
| `spec/components/pages/Categories_spec.js` | Create |
| `spec/components/pages/controllers/CategoriesController_spec.js` | Create |
| `spec/components/pages/helpers/CategoriesHelper_spec.js` | Create |

---

## Notes

- The items index page (`/#/categories/:slug/items`) is out of scope — links should be present
  but the destination page will be built in a future issue.
- Pagination is out of scope — handled by issue [#107](../../issues/107-add-pagination-in-the-frontend.md).
  `CategoriesController` will be updated in #107 to also read pagination headers.
- The Subscribe button visible in the AngularJS template is not mentioned in this issue's scope
  and should be deferred.

## CI Checks

Before opening a PR, run the following for the `frontend/` folder:

- `frontend/`: `docker-compose exec oak_fe npm test` (CircleCI job: `jasmine`)
- `frontend/`: `docker-compose exec oak_fe npm run lint` (CircleCI job: `frontend-checks`)
