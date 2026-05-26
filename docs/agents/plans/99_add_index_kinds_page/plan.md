# Plan: Add Index Kinds Page

## Overview

Add a `/#/kinds` index page to the new React frontend. The page displays a paginated grid of kind cards using `CatalogList` and `CatalogCard` (already available from issue #142). It mirrors the Categories page structure but loads from `/kinds.json` and has no links section on the cards.

## Context

- `/kinds.json` returns kinds with `name`, `slug`, and `snap_url` — no link objects.
- Kind cards link to `/#/kinds/:slug` (the existing kind show page).
- Routing is hash-based: `AppController` matches URL patterns and `AppHelper` maps identifiers to page components.
- The Categories page is the reference implementation to follow.

## Implementation Steps

### Step 1 — Create `KindsController`

Create `frontend/assets/js/components/pages/controllers/KindsController.js` modelled after `CategoriesController.js`:

- Constructor receives `setKinds`, `setPagination`, `setLogged`, `setLoading`, `setError` and an optional `client`.
- `#fetchKinds()` calls `this.client.fetchIndex('/kinds.json')`.
- `#checkLogin()` is identical to the one in `CategoriesController` — consider whether to extract it later, but duplicate for now to stay consistent.
- `buildEffect()` follows the same `mounted` guard pattern.

### Step 2 — Create `KindsHelper`

Create `frontend/assets/js/components/pages/helpers/KindsHelper.jsx`:

- `renderLoading()` → `<LoadingMessage message='Loading kinds...' />`
- `renderError(error)` → `<ErrorContainer error={error} />`
- `render(kinds, pagination)` → `<CatalogList>` with `CatalogCard` per kind:
  - `key={slug}`
  - `href={/#/kinds/${slug}}`
  - `title={name}`
  - `imageSrc={snapUrl}`
  - No footer.
- `#renderPagination(pagination)` → `<Pagination basePath='/#/kinds' ... />`
- No "New" button — kinds are admin-managed (no `logged` parameter needed).

### Step 3 — Create `Kinds` page component

Create `frontend/assets/js/components/pages/Kinds.jsx` modelled after `Categories.jsx`:

- State: `kinds`, `pagination`, `loading`, `error` (no `logged`).
- Instantiates `KindsController` via `useMemo`.
- Delegates all rendering to `KindsHelper`.

### Step 4 — Register the route in `AppController`

Add a hash match in `AppController.js#getPage()`:

```js
if (hash === '#/kinds' || hash === '#/kinds/') {
  return 'kinds';
}
```

### Step 5 — Register the page in `AppHelper`

Add to the `PAGES` map in `AppHelper.jsx`:

```js
import Kinds from '../pages/Kinds.jsx';
// ...
kinds: <Kinds />,
```

### Step 6 — Add tests

Write Jasmine specs for:
- `KindsController` — fetches `/kinds.json`, sets state correctly, handles errors, respects mounted guard.
- `KindsHelper` — renders loading, error, and full grid states; pagination receives correct `basePath`.
- `Kinds` — component wires controller and delegates to helper.
- `AppController` — `getPage()` returns `'kinds'` for `#/kinds` and `#/kinds/`.
- `AppHelper` — `render('kinds')` returns the `<Kinds />` page.

## Files to Change

- `frontend/assets/js/components/pages/controllers/KindsController.js` — **new** controller
- `frontend/assets/js/components/pages/helpers/KindsHelper.jsx` — **new** helper
- `frontend/assets/js/components/pages/Kinds.jsx` — **new** page component
- `frontend/assets/js/components/AppController.js` — add `#/kinds` route match
- `frontend/assets/js/components/helpers/AppHelper.jsx` — add `kinds` entry to PAGES
- `frontend/spec/` — new specs for all of the above; update `AppController` and `AppHelper` specs

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `frontend/`: `docker-compose exec oak_fe npm test` (CircleCI job: `jasmine`) and `docker-compose exec oak_fe npm run lint` (CircleCI job: `frontend-checks`)

## Notes

- No "New" button: kind creation is handled via the AngularJS admin interface, not the new frontend.
- The `#checkLogin` logic is duplicated from `CategoriesController`. If a shared utility is desired, that is a separate refactor.
- `snap_url` falls back to `kind.png` on the backend when no photo exists — no special handling needed in the frontend.
