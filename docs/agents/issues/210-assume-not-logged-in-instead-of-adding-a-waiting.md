# Assume not logged in instead of adding a waiting

## Context

When entering any page for the first time, the app fetches `GET /users/login.json` to check whether the user is logged in. While this request is pending, the navigation menu shows `Loading navigation...`. Since the vast majority of visitors are not logged in, this wait is unnecessary friction before the navigation (and its login button) becomes visible.

## What needs to be done

Frontend: assume the user is logged out by default and render the navigation menu immediately in that state, instead of blocking on the `GET /users/login.json` response. When that request later resolves successfully (user is actually logged in), update the navigation to switch the Login button to Logoff/Logout via the existing login event/auth-state mechanism, the same approach already used for page-level loading (see `frontend/assets/js/utils/authState.js` and the page controllers fixed for issue #207).

## Acceptance criteria

- [ ] The navigation menu no longer shows a "Loading navigation..." state while waiting on `GET /users/login.json`.
- [ ] The navigation renders immediately assuming the user is logged out.
- [ ] If `GET /users/login.json` resolves with a logged-in user, the navigation updates to show Logoff/Logout instead of Login.

---
See issue for details: https://github.com/darthjee/oak/issues/210

Tags: :shipit:
