# Plan: Add Show Category Item Page

## Overview

Build the `CategoryItem` show page at `/#/categories/:category_slug/items/:id` following the
three-layer pattern. Both the slug and the item id must be extracted from the hash URL.
The page displays item metadata, a list of external links, and a Bootstrap photo carousel.

Sub-issue of [#92 — Use React Front-End](../../issues/92-used-react-front-end.md).
Depends on:
- [#97 — Add Index Category Items Page](../../issues/97-add-index-category-items-page.md) (page pattern for nested routes)
- [#109 — Define Generic Client](../../issues/109-define-generic-client.md) (`GenericClient` available)

---

## Context

Hash URL: `#/categories/project/items/35`

```
parts: ["#", "categories", "project", "items", "35"]
                             ↑ [2]               ↑ [4]
                          slug                   id
```

Fetch URL: `/categories/project/items/35.json` — single item, no pagination, uses
`GenericClient.fetch`.

Item JSON shape:

| Field | Type | Notes |
|-------|------|-------|
| `id` | integer | |
| `name` | string | |
| `description` | string | |
| `visible` | boolean | |
| `category` | object | `{ name, slug, snap_url }` |
| `kind` | object | `{ name, slug, snap_url }` |
| `photos` | array | `[{ photo_url, snap_url }]` — may be empty |
| `links` | array | `[{ id, text, url }]` — may be empty |

---

## Implementation Steps

### Step 1 — URL param extraction

Add a utility (or extend the pattern from #97) to extract both the slug and the id from the hash:

```js
function getCategoryItemParamsFromHash() {
  const path = window.location.hash.split('?')[0];
  const parts = path.split('/');
  return { slug: parts[2], id: parts[4] };
}
```

### Step 2 — `CategoryItemController.js`

Create `frontend/assets/js/components/pages/controllers/CategoryItemController.js` (plain
`.js`, not `.jsx` — consistent with `CategoriesController.js` and `HeaderController.js`).

Constructor receives `setItem`, `setLogged`, `setLoading`, `setError`,
`hashProvider = () => window.location.hash`, and `client = new GenericClient(hashProvider)`.

`buildEffect()`:
1. Extract `{ slug, id }` via `getCategoryItemParamsFromHash(this.hashProvider())`
2. Call `this.client.fetch(`/categories/${slug}/items/${id}.json`)` for the item data
3. Check login via a direct `fetch('/users/login.json')` (no hash params should be forwarded)
4. Set state from both results via `Promise.all`
5. Return a cleanup function (set `mounted = false`) to prevent state updates after unmount

### Step 3 — `CategoryItemHelper.jsx`

Create `frontend/assets/js/components/pages/helpers/CategoryItemHelper.jsx`.

Static class:

- `renderLoading()` — spinner
- `renderError(error)` — error alert
- `render(item, logged)`:
  - **Navigation buttons**:
    - "Back" → `/#/categories/${item.category.slug}/items`
    - "Edit" → `/#/categories/${item.category.slug}/items/${item.id}/edit` (shown when `logged`)
  - **Info card** (Bootstrap `card shadow-sm`):
    - Card header: item name
    - Card body:
      - Category name (read-only field)
      - Kind name (read-only field)
      - Description
  - **Links section** (shown when `item.links.length > 0`):
    - `<ul class="list-group">` with one `<li>` per link, each an `<a target="_blank">`
  - **Photo carousel** (shown when `item.photos.length > 0`):
    - Use `react-bootstrap` `<Carousel>` with one `<Carousel.Item>` per photo
    - Each item shows `<img src={photo.photo_url} />`

### Step 4 — `CategoryItem.jsx`

Create `frontend/assets/js/components/pages/CategoryItem.jsx`.

Use `useMemo` to create the controller once and `useEffect` to invoke the returned effect
function — consistent with `Categories.jsx` and `Header.js`.

```jsx
function CategoryItem() {
  const [item, setItem]       = useState(null);
  const [logged, setLogged]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const controller = useMemo(
    () => new CategoryItemController(setItem, setLogged, setLoading, setError),
    []
  );

  useEffect(() => {
    const effect = controller.buildEffect();
    return effect();
  }, [controller]);

  if (loading) return CategoryItemHelper.renderLoading();
  if (error)   return CategoryItemHelper.renderError(error);

  return CategoryItemHelper.render(item, logged);
}
```

### Step 5 — Register route in `AppController.js` and `AppHelper.jsx`

The routing logic lives in two files, not in `App.jsx`:

**`AppController.js`** — update `getPage()` to recognise the show path:

```js
// e.g. hash = "#/categories/project/items/35"
if (/^#\/categories\/[^/]+\/items\/[^/]+(\?.*)?$/.test(hash)) {
  return 'categoryItem';
}
```

Add this check **before** the `categoryItems` index pattern so the more specific route is
matched first (avoids the show path being swallowed by the index pattern).

**`AppHelper.jsx`** — add `CategoryItem` to the `PAGES` map:

```jsx
import CategoryItem from '../pages/CategoryItem.jsx';

const PAGES = {
  categories:   <Categories />,
  categoryItems: <CategoryItems />,
  categoryItem:  <CategoryItem />,
  home:          <p>placeholder</p>,
};
```

### Step 6 — Tests

| Spec file | What it tests |
|-----------|---------------|
| `spec/components/pages/controllers/CategoryItemController_spec.js` | Extracts slug + id, builds correct fetch URL, sets all state; handles empty photos/links |
| `spec/components/pages/helpers/CategoryItemHelper_spec.js` | Back/Edit buttons; info card fields; links list shown/hidden; carousel shown/hidden; Edit hidden when not logged in |
| `spec/components/pages/CategoryItem_spec.js` | Loading, error, and populated render states |

---

## Files to Create / Change

| File | Action |
|------|--------|
| `frontend/assets/js/components/pages/CategoryItem.jsx` | Create |
| `frontend/assets/js/components/pages/controllers/CategoryItemController.js` | Create |
| `frontend/assets/js/components/pages/helpers/CategoryItemHelper.jsx` | Create |
| `frontend/assets/js/components/AppController.js` | Update — add `categoryItem` case to `getPage()` (before `categoryItems` check) |
| `frontend/assets/js/components/helpers/AppHelper.jsx` | Update — add `CategoryItem` to the `PAGES` map |
| `spec/components/pages/CategoryItem_spec.js` | Create |
| `spec/components/pages/controllers/CategoryItemController_spec.js` | Create |
| `spec/components/pages/helpers/CategoryItemHelper_spec.js` | Create |
| `spec/components/app/AppController_spec.js` | Update — add spec for `categoryItem` page route |
| `spec/components/helpers/AppHelper_spec.js` | Update — add spec for `CategoryItem` rendering |

---

## Notes

- Route ordering in `AppController.js` (`getPage()`) matters: the `categoryItem` regex must
  be checked **before** the `categoryItems` regex to avoid the show path being swallowed by
  the index pattern.
- Controllers are `.js` files; helpers and page components are `.jsx` — follow the naming
  convention established by `CategoriesController.js` / `CategoriesHelper.jsx`.
- The `Carousel` component from `react-bootstrap` handles the Bootstrap 5 carousel; no need
  for manual `data-bs-*` attributes.
- When `item` is `null` (initial state before fetch resolves), `renderLoading()` is returned —
  the helper's `render` method never receives a null item.
- The edit page (`/#/categories/:slug/items/:id/edit`) is out of scope for this issue.

## CI Checks

Before opening a PR, run the following for the `frontend/` folder:

- `frontend/`: `docker-compose exec oak_fe npm test` (CircleCI job: `jasmine`)
- `frontend/`: `docker-compose exec oak_fe npm run lint` (CircleCI job: `frontend-checks`)
