# HTTP Contract

Part of the [device authorization spec](../authorization.md). Used by #393, #394, #395, #397, #398.

## Common rules (all five endpoints)

- All are **`POST`** with a JSON body (`Content-Type: application/json`), paths end in `.json`.
  `mine` is a `POST` too, so no proxy or browser ever treats it as a cacheable read.
- JSON keys are **camelCase**. Timestamps are ISO 8601 in UTC, e.g. `"2026-10-20T15:04:05.000Z"`.
- Every response, success or error, carries the header **`X-Skip-Cache: true`** (always, not only
  when the session cookie exists), so the Tent proxy never caches them. The frontend clients also
  send the request header `X-Skip-Cache: 1`, like `LoginModalClient`. No Tent rule changes.
- **CSRF:** the new actions are exempted with `protect_from_forgery except: [...]`, Oak's pattern.
- Error bodies are `{ "message": "<human-readable text>" }`. The frontend shows `message`; the
  exact wording is left to the backend sub-issues.
- **"Logged out"** means no active session from the signed `session` cookie or from
  `Authorization: Bearer`.

| Endpoint | Auth | Request body | Success (`200`) |
|---|---|---|---|
| `/auth/authorization-requests.json` | public | `{ login, keepSignedIn }` | `{ uuid, pollToken, expiresAt }` |
| `/auth/authorization-requests/:uuid/poll.json` | public | `{ pollToken }` | `{ status }` or `{ status: "approved", session }` + cookie |
| `/auth/authorization-requests/mine.json` | logged in | `{}` | `{ requests: [...] }` |
| `/auth/authorization-requests/:uuid/authorize.json` | logged in | `{ password }` | `{ authorized: true }` |
| `/auth/authorization-requests/:uuid/deny.json` | logged in | `{}` | `{ denied: true }` |

## create (public, #394)

```jsonc
// POST /auth/authorization-requests.json
{ "login": "alice", "keepSignedIn": false }
// 200
{ "uuid": "3f1c2a9e-…", "pollToken": "Zq3…", "expiresAt": "2026-10-20T16:04:05.000Z" }
```

| Outcome | Status | Body |
|---|---|---|
| Created (login known **or unknown**) | `200` | `{ uuid, pollToken, expiresAt }` |
| `login` missing or blank, or `keepSignedIn` present and not a strict boolean | `400` | `{ message }` |
| Over the per-IP rate limit ([data-model.md](data-model.md)) | `429` | `{ message }` |

- `keepSignedIn` is optional (default `false`).
- The `200` response is **identical** whether or not the login exists.
  An unknown login gets a row with `user_id = NULL`, which simply expires.
- Creating a request for a known user may expire that user's oldest open request (the cap).
- `pollToken` is returned only here, once.

## poll (public, #394)

```jsonc
// POST /auth/authorization-requests/3f1c2a9e-…/poll.json
{ "pollToken": "Zq3…" }
// 200 while waiting
{ "status": "open" }
// 200 on the poll that wins the claim (plus Set-Cookie: session=…)
{ "status": "approved", "session": { "expiration": "…", "token": "…" } }
```

| Outcome | Status | Body |
|---|---|---|
| Waiting | `200` | `{ "status": "open" }` |
| First poll after approval (atomic claim) | `200` | `{ "status": "approved", "session": {...} }` + signed `session` cookie |
| Already claimed by an earlier poll | `200` | `{ "status": "logged" }` |
| Denied / expired | `200` | `{ "status": "denied" }` / `{ "status": "expired" }` |
| Unknown `uuid`, missing or wrong `pollToken` | `404` | `{ message }` |

- `session` has the **same shape as the body of `GET /users/login.json`** (the `Session`
  decorator: `expiration`, `token`). The reference design called this field `user`; Oak's login
  endpoints return a session object, so it is named `session` here. The frontend does not read
  it: `onAuthSuccess` re-checks `GET /users/login.json` (see [frontend-shell.md](frontend-shell.md)).
- The session is created with the request's `keep_signed_in` ([keep-signed-in.md](keep-signed-in.md)).

## mine (logged in, #395)

```jsonc
// POST /auth/authorization-requests/mine.json   {}
// 200
{ "requests": [
  { "uuid": "3f1c…", "requestIp": "203.0.113.7", "requestUserAgent": "Mozilla/5.0 …",
    "createdAt": "2026-10-20T15:04:05.000Z", "expiresAt": "2026-10-20T16:04:05.000Z",
    "keepSignedIn": false }
] }
```

- Only the caller's requests that are `open` and not expired, newest first. Empty list → `{ "requests": [] }`.
- Logged out → `401` `{ message }`.

## authorize and deny (logged in, #395)

`authorize` body: `{ "password": "secret" }` → `200 { "authorized": true }`, request becomes `approved`.
`deny` body: `{}` → `200 { "denied": true }`, request becomes `denied`.

| Outcome | Status |
|---|---|
| Logged out | `401` `{ message }` |
| Unknown `uuid`, or the request belongs to another user (or to no user) | `400` `{ message }` |
| Request not `open`, or expired | `400` `{ message }` |
| `authorize` only: user locked (`authorization_locked_until > now`) | `400` `{ message }` |
| `authorize` only: wrong password (counts toward the lockout) | `400` `{ message }` |

Checks run in the order of the table. These endpoints never answer `403`/`404` for business errors.

## 401 only on the new endpoints

Only `mine`, `authorize` and `deny` answer `401` when logged out. Every existing endpoint keeps
its behavior (`LoggedUser` answers `404`, `UserRequired` redirects to `/#/forbidden`). Unifying
all logged-out responses as `401` is a separate follow-up issue outside this Epic.

## Login change (#393)

`POST /users/login.json` accepts an optional strict-boolean `keepSignedIn` inside the `login`
object. Missing → `false` (today's behavior); non-boolean → `400`. Details in
[keep-signed-in.md](keep-signed-in.md).
