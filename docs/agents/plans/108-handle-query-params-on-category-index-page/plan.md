# Plan: Handle Query Params on Category Index Page

## Overview

Update `CategoriesController` to read query parameters from the current URL and forward them
to the `GET /categories.json` fetch. This completes the pagination flow introduced in
issue #107 — clicking a page link navigates to `/#/categories?page=N&per_page=N` and the
page now fetches the correct data.

Sub-issue of [#92 — Use React Front-End](../../issues/92-used-react-front-end.md).
Depends on [#95 — Build Index Categories Page](../../issues/95-build-index-categories-page.md)
and [#107 — Add Pagination in the Frontend](../../issues/107-add-pagination-in-the-frontend.md).

---

## Context

Hash-based URLs store query params after the hash fragment, e.g.:

```
/#/categories?page=2&per_page=10
         ↑ window.location.hash = "#/categories?page=2&per_page=10"
```

`window.location.search` is empty in hash routing — the params must be extracted from
`window.location.hash` by splitting on `?`.

---

## Implementation Steps

### Step 1 — Extract query params from the hash URL

Add a utility function (or a static helper method on `CategoriesController`) that parses the
query string from the hash:

```js
function getHashQueryParams() {
  const hash = window.location.hash; // e.g. "#/categories?page=2&per_page=10"
  const queryString = hash.includes('?') ? hash.split('?')[1] : '';
  return new URLSearchParams(queryString);
}
```

### Step 2 — Update `CategoriesController.jsx`

In `buildEffect()`, read the params and append them to the fetch URL:

```js
buildEffect() {
  return () => {
    const params = getHashQueryParams();
    const query = params.toString() ? `?${params.toString()}` : '';

    Promise.all([
      fetch(`/categories.json${query}`).then(r => r.json()),
      fetch('/users/login.json').then(r => r.json()),
    ])
      .then(([categories, loginData]) => {
        this.#setCategories(categories);
        this.#setLogged(loginData.logged);
      })
      .catch(err => this.#setError(err.message))
      .finally(() => this.#setLoading(false));
  };
}
```

### Step 3 — Tests

Update `CategoriesController_spec.js` to cover:

| Scenario | Expected behaviour |
|----------|--------------------|
| No query params in hash | fetches `/categories.json` (no suffix) |
| `?page=2` in hash | fetches `/categories.json?page=2` |
| `?page=3&per_page=5` in hash | fetches `/categories.json?page=3&per_page=5` |

Add unit tests for `getHashQueryParams()` (or the equivalent static method) directly.

---

## Files to Change

| File | Action |
|------|--------|
| `frontend/assets/js/components/pages/controllers/CategoriesController.jsx` | Update — read hash query params and forward to fetch |
| `spec/components/pages/controllers/CategoriesController_spec.js` | Update — add query-forwarding scenarios |

Optionally, if `getHashQueryParams` is extracted as a shared utility:

| File | Action |
|------|--------|
| `frontend/assets/js/utils/hashQueryParams.js` | Create — shared utility |
| `spec/utils/hashQueryParams_spec.js` | Create — unit tests |

---

## Notes

- If React Router is introduced before this issue is implemented, use `useLocation().search`
  instead of parsing `window.location.hash` manually.
- This pattern (read hash params → forward to fetch) will be reused by every future paginated
  page — consider extracting the utility early so subsequent issues can import it directly.
- No changes to `CategoriesHelper`, `Categories.jsx`, or `App.jsx` are needed.

## CI Checks

Before opening a PR, run the following for the `frontend/` folder:

- `frontend/`: `docker-compose exec oak_fe npm test` (CircleCI job: `jasmine`)
- `frontend/`: `docker-compose exec oak_fe npm run lint` (CircleCI job: `frontend-checks`)
