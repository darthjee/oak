# Utility Routes

These routes are **API-only**: they return JSON (or perform an action) and are called directly by frontend clients/controllers — never navigated to as pages.

## Session

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| POST | `/users/login` | `login#create` | Authenticates the user with `login` + `password` params. Returns the session as JSON. Accepts an optional `keepSignedIn` (see below). |
| GET | `/users/login` | `login#check` | Returns the current session as JSON. Used to check whether the user is still logged in. |
| DELETE | `/users/logoff` | `login#logoff` | Destroys the current session. |

`POST /users/login` accepts an optional strict-boolean `keepSignedIn` inside the `login` object
(`{ "login": { "login", "password", "keepSignedIn" } }`). Missing means `false`: the session lasts
`Settings.session_period` (default 2 days) with a browser-session cookie. `true` makes the session
last `Settings.long_session_period` (default 30 days) with a persistent `session` cookie that
expires with it. A non-boolean value answers `400` `{ message }` and creates no session.

## Device Authorization

"Authorize with logged device": a logged-out device logs in with only a `login`, approved from a
device already logged in as the same user. See
[Device Authorization](../architecture/device-authorization.md) for the flow.

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| POST | `/auth/authorization-requests` | `auth/authorization_requests#create` | Public. Body `{ login, keepSignedIn }`. Creates a request and returns `{ uuid, pollToken, expiresAt }` (same `200` for known and unknown logins). |
| POST | `/auth/authorization-requests/:uuid/poll` | `auth/authorization_requests#poll` | Public. Body `{ pollToken }`. Returns `{ status }`; the first poll after approval returns `{ status: "approved", session }` plus the signed `session` cookie. |
| POST | `/auth/authorization-requests/mine` | `auth/authorization_request_approvals#mine` | Logged in. Returns `{ requests: [...] }`: the caller's open, unexpired requests, newest first. |
| POST | `/auth/authorization-requests/:uuid/authorize` | `auth/authorization_request_approvals#authorize` | Logged in. Body `{ password }` (the approver's own). Returns `{ authorized: true }`. |
| POST | `/auth/authorization-requests/:uuid/deny` | `auth/authorization_request_approvals#deny` | Logged in. Returns `{ denied: true }`. |

- All five are JSON `POST`s (`.json` paths, camelCase keys, CSRF-exempt) and always answer the
  header `X-Skip-Cache: true`, so Tent never caches them. Errors are `{ "message": "..." }`.
- `create`: `400` for a blank `login` or a non-boolean `keepSignedIn`, `429` over the per-IP rate
  limit.
- `poll`: `404` for an unknown `uuid` or a wrong `pollToken`. Otherwise `200` with `status` one of
  `open`, `approved`, `logged`, `denied`, `expired`.
- `mine`, `authorize`, `deny`: `401` when logged out (only these endpoints use `401`; older ones
  keep `404` / the `/#/forbidden` redirect). Every business error (unknown or foreign request, not
  open, expired, locked, wrong password) is `400`.

## User Navigation Data

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| GET | `/user/categories` | `user/categories#index` | Returns the list of categories the logged user is subscribed to. Loaded on **every page** to build the category menu in the header. Returns all categories for anonymous users. |

## Form Support

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| GET | `/categories/:category_slug/kinds` | `category/kinds#index` | Returns the kinds associated with a category as JSON. Used to populate the kind `ng_select` dropdown in the item form. |

## Subscriptions

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| POST | `/categories/:category_slug/subscriptions` | `subscriptions#create` | Subscribes the logged user to a category. Idempotent — returns `200 OK` if already subscribed, `201 Created` if newly subscribed. |

---

## Disabled / Pending Cleanup

| Path | Notes |
|------|-------|
| `GET /users` | Should be disabled. User management is handled by `/admin/users`. Pending removal. |
