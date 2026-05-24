# Plan: Add Pagination in the Frontend

## Overview

Build a reusable `Pagination` element following the three-layer pattern, then wire it into the
categories index page. Pagination metadata is read from API response headers. The core logic is
a pure page-list algorithm that is straightforward to unit-test.

Sub-issue of [#92 — Use React Front-End](../../issues/92-used-react-front-end.md).
Depends on [#95 — Build Index Categories Page](../../issues/95-build-index-categories-page.md)
(`CategoriesController` and `CategoriesHelper` must exist first).

---

## Context

The Rails API returns three pagination headers on paginated responses:

| Header | Meaning |
|--------|---------|
| `page` | Current page number |
| `pages` | Total number of pages |
| `per_page` | Items per page |

Page links follow the pattern `/#/<route>?page=N&per_page=N`.

The page list algorithm (mirroring the existing Cyberhawk paginator) produces a sorted,
deduplicated sequence of page numbers with `null` entries representing `…` gaps:

```
Input:  currentPage=10, totalPages=20
Output: [1, 2, 3, null, 7, 8, 9, 10, 11, 12, 13, null, 18, 19, 20]
```

**Algorithm:**
1. Build a `Set` of page numbers:
   - First 3: `1, 2, 3`
   - Last 3: `totalPages-2, totalPages-1, totalPages`
   - Window: `currentPage-3` through `currentPage+3`
   - Clamp all entries to `[1, totalPages]`
2. Sort the set into a flat array
3. Walk the array; wherever two consecutive entries differ by more than 1, insert `null` between them

---

## Implementation Steps

### Step 1 — `PaginationController.jsx`

Create `frontend/assets/js/components/elements/controllers/PaginationController.jsx`.

Plain JS class. Responsible for building the page list array.

```js
class PaginationController {
  constructor(currentPage, totalPages) { ... }

  buildPageList() {
    // returns an array of integers and nulls
  }
}
```

No state setters — this controller is instantiated directly inside the helper or component with
the current props, and its output is used synchronously to build the JSX.

### Step 2 — `PaginationHelper.jsx`

Create `frontend/assets/js/components/elements/helpers/PaginationHelper.jsx`.

Static class. Renders Bootstrap 5 pagination:

- `render(currentPage, totalPages, perPage, basePath)` — main render method:
  - Calls `new PaginationController(currentPage, totalPages).buildPageList()` to get the list
  - Renders a `<nav>` with Bootstrap `.pagination` containing:
    - `«` previous button (disabled when `currentPage <= 1`)
    - One `<li>` per entry: a link if entry is a number, a `…` span if `null`
    - Active class on the current page
    - `»` next button (disabled when `currentPage >= totalPages`)
  - Each page link href: `${basePath}?page=${n}&per_page=${perPage}`

### Step 3 — `Pagination.jsx`

Create `frontend/assets/js/components/elements/Pagination.jsx`.

Thin functional component — receives props and delegates entirely to the helper:

```jsx
function Pagination({ currentPage, totalPages, perPage, basePath }) {
  return PaginationHelper.render(currentPage, totalPages, perPage, basePath);
}
```

No state, no effects needed — all data arrives via props.

### Step 4 — Update `CategoriesController.jsx`

Extend the `buildEffect()` method to also read pagination headers from the fetch response:

```js
const response = await fetch('/categories.json');
const data = await response.json();

const page    = parseInt(response.headers.get('page'), 10);
const pages   = parseInt(response.headers.get('pages'), 10);
const perPage = parseInt(response.headers.get('per_page'), 10);

this.#setCategories(data);
this.#setPagination({ page, pages, perPage });
```

Add a `setPagination` setter to the constructor.

### Step 5 — Update `CategoriesHelper.jsx`

Update the `render` method signature to accept `pagination` and render `<Pagination />` below
the card grid:

```jsx
static render(categories, pagination) {
  const { page, pages, perPage } = pagination;
  return (
    <>
      {/* card grid */}
      <Pagination
        currentPage={page}
        totalPages={pages}
        perPage={perPage}
        basePath="/#/categories"
      />
    </>
  );
}
```

### Step 6 — Update `Categories.jsx`

Add `pagination` state and pass it through:

```jsx
const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
const controller = new CategoriesController(setCategories, setPagination, setLoading, setError);
// ...
return CategoriesHelper.render(categories, pagination);
```

### Step 7 — Tests

| Spec file | What it tests |
|-----------|---------------|
| `spec/components/elements/controllers/PaginationController_spec.js` | `buildPageList()` for edge cases: single page, two pages, current near start, current near end, current in middle |
| `spec/components/elements/helpers/PaginationHelper_spec.js` | `render()` produces correct link hrefs, active class, disabled state for `«`/`»` |
| `spec/components/elements/Pagination_spec.js` | Delegates to helper with correct props |
| `spec/components/pages/controllers/CategoriesController_spec.js` | `buildEffect()` reads pagination headers and calls `setPagination` |

---

## Files to Create / Change

| File | Action |
|------|--------|
| `frontend/assets/js/components/elements/Pagination.jsx` | Create |
| `frontend/assets/js/components/elements/controllers/PaginationController.jsx` | Create |
| `frontend/assets/js/components/elements/helpers/PaginationHelper.jsx` | Create |
| `frontend/assets/js/components/pages/Categories.jsx` | Update — add `pagination` state |
| `frontend/assets/js/components/pages/controllers/CategoriesController.jsx` | Update — read pagination headers |
| `frontend/assets/js/components/pages/helpers/CategoriesHelper.jsx` | Update — render `<Pagination />` |
| `spec/components/elements/Pagination_spec.js` | Create |
| `spec/components/elements/controllers/PaginationController_spec.js` | Create |
| `spec/components/elements/helpers/PaginationHelper_spec.js` | Create |
| `spec/components/pages/controllers/CategoriesController_spec.js` | Update |

---

## Notes

- `PaginationController` has no side effects and needs no state setters — it is a pure
  computation class, making it the easiest layer to test thoroughly.
- When `totalPages <= 1`, render nothing (or a disabled single-page indicator) to avoid
  cluttering the UI.
- The `basePath` prop keeps `Pagination` reusable across all future index pages — no hardcoded
  routes inside the element.
- Verify that Rails CORS / rack headers expose `page`, `pages`, and `per_page` to the browser
  before implementing; if not, they must be added to `config/application.rb` or a middleware.

## CI Checks

Before opening a PR, run the following for the `frontend/` folder:

- `frontend/`: `docker-compose exec oak_fe npm test` (CircleCI job: `jasmine`)
- `frontend/`: `docker-compose exec oak_fe npm run lint` (CircleCI job: `frontend-checks`)
