# Plan: Keep me signed in for password login

Issue: [393-keep-me-signed-in-for-password-login.md](../../issues/393-keep-me-signed-in-for-password-login.md)

## Overview

Add an optional "Keep me signed in" choice to the password login. The backend gets a
`long_session_period` setting and a strict-boolean `keepSignedIn` login param. When it's `true`,
the session lasts longer and the signed `session` cookie becomes persistent.
`LoggedUser::Processor#login` takes the option so device authorization (#394) can reuse it. The
frontend adds the checkbox to the login modal and sends the flag. The authoritative contract is
[docs/agents/specs/authorization/keep-signed-in.md](../../specs/authorization/keep-signed-in.md).

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- **Request:** `POST /users/login.json` with body
  `{ "login": { "login": "<string>", "password": "<string>", "keepSignedIn": <boolean> } }`.
  - `keepSignedIn` is optional, and a missing value means `false` (today's behavior).
  - It must be a strict JSON boolean. Any other value (`"true"`, `1`, `null`, ...) answers
    `400` with `{ "message": "<text>" }` and creates no session.
  - The frontend always sends it, as `Boolean(value)`.
- **Response:** unchanged. On success it's `200` with the `Session` decorator (`expiration`,
  `token`). Bad credentials still answer `404`.
- **Session and cookie:**
  - `keepSignedIn: true` → `expiration = Settings.long_session_period.from_now` (default
    `30.days`), and the signed `session` cookie gets `expires` equal to that expiration.
  - `false` or missing → `Settings.session_period` (2 days), with a browser-session cookie (no
    `expires`), as today.
