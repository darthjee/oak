# Don't wait login for loading

## Context

On the frontend, upon entering the app, the `Header` component loads `GET /users/login.json` to check the user's login state. Every page controller (subclassing `BasePageController`, e.g. `CategoriesController`) independently calls `Promise.all([fetchData(), this.checkLogin()])`, where `checkLogin()` issues its own `GET /users/login.json` request. The page only stops showing its loading state once **both** promises resolve.

This means:
- `GET /users/login.json` is requested twice on every page load (once by `Header`, once by the page controller).
- Page content — which could otherwise be served instantly from cache — is unnecessarily gated behind the login check, slowing down initial load for non-logged-in users.
- There is currently no event/pub-sub mechanism in the frontend to notify other components when the login check resolves; each page re-implements its own `checkLogin()` call instead of reacting to a shared signal.

## What needs to be done

- **Frontend:** Decouple page content loading from each page controller's own `GET /users/login.json` call — pages should fetch and render their own data without waiting on `checkLogin()`.
- **Frontend:** Introduce a shared mechanism (e.g. an event emitted by `Header` once its login check resolves) that pages can subscribe to, so they can refresh/update content when login status becomes known, without duplicating the network request themselves.
- **Frontend:** Remove the now-redundant `checkLogin()` call from `BasePageController`'s `Promise.all()` once pages react to the shared login signal instead.

## Acceptance criteria

- [ ] Page content renders without waiting for `GET /users/login.json` to resolve.
- [ ] `GET /users/login.json` is requested only once per page load (by `Header`), not duplicated by page controllers.
- [ ] When the login check resolves and indicates the user is logged in, affected pages still react and reload/update their content accordingly.
- [ ] Existing Jasmine tests for `Header`, `BasePageController`, and at least one concrete page controller (e.g. `CategoriesController`) are updated to reflect the new flow and pass.

---
See issue for details: https://github.com/darthjee/oak/issues/207
