# HTTP contract

## `http-contract.md`

Specify every endpoint exactly: method, path, auth, request body, response body (field names and types), and the status code for each outcome. Port the guide's §4, with these Oak adaptations:

- **Paths.** Choose paths that fit Oak's routes, and state them exactly. Keep the guide's shape unless Oak conventions dictate otherwise, e.g. `POST /auth/authorization-requests.json`, `.../:uuid/poll.json`, `.../mine.json`, `.../:uuid/authorize.json` and `.../:uuid/deny.json`. The guide uses `POST` for `mine`. Decide whether Oak uses `GET` for it, and state the choice.
- **create (public).** Body `{ login, keepSignedIn }`, using `login`, not `username`. The response `{ uuid, pollToken, expiresAt }` is identical whether or not the login exists. Rate limited per IP. A strict-boolean `keepSignedIn` violation answers 400. Over the rate limit answers 429 or 400; pick one.
- **poll (public).** Body `{ pollToken }` → `{ status }`. When the poll is the first to see the approval: `{ status: 'approved', user }`, using the same user shape as `GET /users/login.json`, and the signed `session` cookie is set. An unknown `uuid` or a wrong token answers `404`.
- **mine (logged in).** Returns `{ requests: [{ uuid, requestIp, requestUserAgent, createdAt, expiresAt, keepSignedIn }] }`, only the caller's open requests.
- **authorize (logged in).** Body `{ password }` → `{ authorized: true }`.
- **deny (logged in).** Returns `{ denied: true }`.
- **Business errors on authorize and deny all answer `400` with `{ message }`.** These are: wrong password, lockout (5 failures lock authorizing for 5 minutes), wrong owner, wrong status, and expired.
- **Logged out on mine, authorize or deny answers `401`.** Only these new endpoints do this; every existing endpoint keeps answering `404` or redirecting. Unifying that is a separate follow-up issue outside this Epic.
- **Caching.** Every new endpoint **always** sends `X-Skip-Cache`, because the requester has no session cookie. No Tent rule changes are needed.
- **CSRF.** Follow Oak's pattern: the new JSON POSTs are exempt.
- **Login change.** Add the `keepSignedIn` addition to `POST /users/login.json`, cross-referencing `keep-signed-in.md`.
- **Examples.** Include short JSON examples, like the guide's.

## Files to Change
- `docs/agents/specs/authorization/http-contract.md` — new.
