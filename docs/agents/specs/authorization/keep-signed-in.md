# Keep Me Signed In

Part of the [device authorization spec](../authorization.md). Implemented by #393; reused by
#394 (session minting) and #397 (device form checkbox).

## Today

- `POST /users/login.json` takes `{ "login": { "login": "...", "password": "..." } }`.
- It creates a `Session` with `expiration = Settings.session_period.from_now` (default 2 days)
  and stores the session id in a **signed `session` cookie with no expiry** (a browser-session
  cookie, gone when the browser closes).
- `Authorization: Bearer <token>` is also accepted to identify the session.

## New behavior

- The password form in the login modal gets an optional **"Keep me signed in"** checkbox,
  unticked by default and cleared whenever the modal is cleared.
- `POST /users/login.json` accepts an optional `keepSignedIn` inside the `login` object:

  ```json
  { "login": { "login": "alice", "password": "secret", "keepSignedIn": true } }
  ```

  - Missing → `false`, which behaves **exactly as today**.
  - Must be a strict JSON boolean (`true` / `false`). Any other value answers `400` with
    `{ "message": "..." }` and creates no session. The frontend sends `Boolean(value)`.
- When `keepSignedIn` is `true`:
  - the session's `expiration` is `Settings.long_session_period.from_now` (default 30 days);
  - the signed `session` cookie is **persistent**, with `expires` equal to the session's
    `expiration`.
- The response body is unchanged (the `Session` decorator: `expiration`, `token`).

## Session minting (shared by both flows)

`LoggedUser::Processor#login` (or its equivalent) accepts the keep-signed-in option, so:

- password login passes the `keepSignedIn` param;
- device authorization (#394) passes the request's `keep_signed_in` column when the winning poll
  mints the session.

Both flows produce an identical, regular `Session` row and signed cookie.

## Device authorization

- The requester ticks the same checkbox on the device form; it is sent as `keepSignedIn` on
  create (see [http-contract.md](http-contract.md)) and stored in `keep_signed_in`.
- The approver sees it as a **"Keep signed in"** badge on the request's row and cannot change it.

## Unchanged

- Existing sessions keep their current expiration.
- `Settings.session_period` and the default session length.
- Bearer-token authentication.
- Logoff (`DELETE /users/logoff`): expires the session and deletes the cookie, as today.
