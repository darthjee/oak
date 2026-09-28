# Frontend Plan: Frontend — photo migration page with request loop

Main plan: [plan.md](plan.md)

## Overview
Build the `PhotoMigration` page that drives the proxy migration endpoint in a loop, following the existing page pattern (`pages/X.jsx` + `pages/controllers/XController.js` + `pages/helpers/XHelper.jsx`). Also add a `PhotoMigrationClient`, the hash route, and a logged-in-only header link.

## Context
- Endpoint (already merged in #381): `POST /migrations/photos?limit=N`, authenticated by the session cookie.
  - `200`: `{ "migrated": <int>, "missing": [ids], "failed": [{ "id", "reason" }], "remaining": <int> }`.
  - `401`/`403`: passed through from the backend.
  - `502`: invalid backend response, or the confirm call failed.
- `remaining` is already adjusted for the batch. Failed photos stay `migrating` for 5 minutes, so a run with failures normally ends on "no progress" with `remaining > 0`.
- Loop rules:
  - Continue while `remaining > 0` and `migrated + missing.length > 0`.
  - Stop on `remaining === 0`, no progress, any HTTP error, or **Stop**. Stop waits for the request in flight and still adds its result to the totals.
- Each page load allows one run. Once the loop ends for any reason (**Stop** included), the button stays disabled. There is no restart and no automatic retry.
- Login state comes from `utils/authState.js` (`isLoggedIn()`, `subscribe()`), which `HeaderController` fills in asynchronously. So the page must subscribe rather than read the state once.

## Steps

- [01 — Add PhotoMigrationClient](frontend/01-add-photo-migration-client.md)
- [02 — Add PhotoMigration controller with the request loop](frontend/02-add-photo-migration-controller.md)
- [03 — Add PhotoMigration page and helper](frontend/03-add-photo-migration-page-and-helper.md)
- [04 — Register route and header link](frontend/04-register-route-and-header-link.md)

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- Merge and deploy only after the proxy sub-issue (#381, already merged).
- The page is temporary. Its removal is tracked in #379, so keep it self-contained: no shared abstractions that other code starts depending on.
- The endpoint is a proxy-only route (no `.json` suffix and no backend `GenericClient` path conventions). Use `fetch` directly, like `PhotoUploadClient`.
