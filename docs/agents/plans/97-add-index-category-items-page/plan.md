# Plan: Add Index Category Items Page

## Overview

Build the `CategoryItems` page at `/#/categories/:category_slug/items` following the same
three-layer pattern as `Categories`. The key difference is that the page must extract the
category slug from the hash URL and use it both in the fetch path and in the pagination links.

Sub-issue of [#92 — Use React Front-End](../../issues/92-used-react-front-end.md).
Depends on:
- [#95 — Build Index Categories Page](../../issues/95-build-index-categories-page.md) (page pattern established)
- [#107 — Add Pagination in the Frontend](../../issues/107-add-pagination-in-the-frontend.md) (`Pagination` element available)
- [#109 — Define Generic Client](../../issues/109-define-generic-client.md) (`GenericClient` available)

---

## Context

Hash URL for this page: `#/categories/project/items?page=2&per_page=10`

The slug (`project`) sits between `/categories/` and `/items` in the hash path. It must be
extracted before building the fetch URL (`/categories/project/items.json?page=2&per_page=10`)
and before building the pagination `basePath` (`/#/categories/project/items`).

Item JSON shape:
```json
{
  "id": 35,
  "name": "Oak",
  "snap_url": "http://...",
  "link": { "id": 35, "text": "Github", "url": "https://github.com/darthjee/oak" }
}
```

Items with `link: null` must not render the external link anchor.

---

## Implementation Steps

### Step 1 — Slug extraction utility

Add a helper that parses the category slug from the hash path. Can live in
`GenericClient` or as a small standalone utility:

```js
// e.g. hash = "#/categories/project/items?page=2"
function getCategorySlugFromHash() {
  const path = window.location.hash.split('?')[0]; // "#/categories/project/items"
  const parts = path.split('/');                   // ["#", "categories", "project", "items"]
  return parts[2];                                 // "project"
}
```

### Step 2 — `CategoryItemsController.jsx`

Create `frontend/assets/js/components/pages/controllers/CategoryItemsController.jsx`.

Constructor receives `setItems`, `setLogged`, `setPagination`, `setLoading`, `setError`.

`buildEffect()`:
1. Extract slug via `getCategorySlugFromHash()`
2. Call `client.fetchIndex(`/categories/${slug}/items.json`)` and `client.fetch('/users/login.json')` in parallel
3. Set all state from results

### Step 3 — `CategoryItemsHelper.jsx`

Create `frontend/assets/js/components/pages/helpers/CategoryItemsHelper.jsx`.

Static class:

- `renderLoading()` — spinner
- `renderError(error)` — error alert
- `render(items, logged, pagination, slug)`:
  - "New" button → `/#/categories/${slug}/items/new` (shown when `logged`)
  - "Edit" button → `/#/categories/${slug}/edit` (shown when `logged`)
  - Bootstrap `.row` grid, one card per item:
    - Link to `/#/categories/${slug}/items/${item.id}` wrapping name + snapshot image
    - External link anchor (`target="_blank"`) shown only when `item.link` is present
  - `<Pagination basePath={/#/categories/${slug}/items} ... />`

### Step 4 — `CategoryItems.jsx`

Create `frontend/assets/js/components/pages/CategoryItems.jsx`.

```jsx
function CategoryItems() {
  const [items, setItems]           = useState([]);
  const [logged, setLogged]         = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const slug = getCategorySlugFromHash();
  const controller = new CategoryItemsController(setItems, setLogged, setPagination, setLoading, setError);

  useEffect(controller.buildEffect(), []);

  if (loading) return CategoryItemsHelper.renderLoading();
  if (error)   return CategoryItemsHelper.renderError(error);

  return CategoryItemsHelper.render(items, logged, pagination, slug);
}
```

### Step 5 — Register route in `App.jsx`

Add a route matcher for `/#/categories/:slug/items` that renders `<CategoryItems />`.

### Step 6 — Tests

| Spec file | What it tests |
|-----------|---------------|
| `spec/components/pages/controllers/CategoryItemsController_spec.js` | Extracts slug, builds correct fetch URL, sets all state |
| `spec/components/pages/helpers/CategoryItemsHelper_spec.js` | Card grid; external link shown/hidden; "New"/"Edit" shown only when logged; `Pagination` receives correct `basePath` |
| `spec/components/pages/CategoryItems_spec.js` | Loading, error, and populated render states |

---

## Files to Create / Change

| File | Action |
|------|--------|
| `frontend/assets/js/components/pages/CategoryItems.jsx` | Create |
| `frontend/assets/js/components/pages/controllers/CategoryItemsController.jsx` | Create |
| `frontend/assets/js/components/pages/helpers/CategoryItemsHelper.jsx` | Create |
| `frontend/assets/js/components/App.jsx` | Update — register `/#/categories/:slug/items` route |
| `spec/components/pages/CategoryItems_spec.js` | Create |
| `spec/components/pages/controllers/CategoryItemsController_spec.js` | Create |
| `spec/components/pages/helpers/CategoryItemsHelper_spec.js` | Create |

---

## Notes

- The show page (`/#/categories/:slug/items/:id`) is out of scope — links must be present but
  the destination page is built in a future issue.
- `getCategorySlugFromHash` assumes a fixed path structure — if React Router is introduced
  before this issue, use `useParams()` instead.
- The `Pagination` `basePath` must include the slug so page links stay scoped to the correct
  category.

## CI Checks

Before opening a PR, run the following for the `frontend/` folder:

- `frontend/`: `docker-compose exec oak_fe npm test` (CircleCI job: `jasmine`)
- `frontend/`: `docker-compose exec oak_fe npm run lint` (CircleCI job: `frontend-checks`)
