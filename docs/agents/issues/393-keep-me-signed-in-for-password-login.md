# Issue: Keep me signed in for password login

## Description
Part of Epic #391 (device authorization login). Add a "Keep me signed in" option to the regular password login. The device-authorization flow (#394, #397) reuses the same session-minting option later. The authoritative contract is [docs/agents/specs/authorization/keep-signed-in.md](../specs/authorization/keep-signed-in.md) (with [http-contract.md](../specs/authorization/http-contract.md) and [data-model.md](../specs/authorization/data-model.md)).

## Problem
Today every login creates a `Session` expiring after `Settings.session_period` (2 days) and stores its id in a signed `session` cookie with **no expiry**, so the cookie is lost when the browser closes. Users can't choose a longer, persistent login, and the device-authorization flow has no way to mint one.

## Expected Behavior
- The password form in the login modal shows a **"Keep me signed in"** checkbox, unticked by default and cleared whenever the modal is cleared.
- `POST /users/login.json` accepts an optional `keepSignedIn` inside the `login` object:
  `{ "login": { "login": "alice", "password": "secret", "keepSignedIn": true } }`
  - Missing → `false`, which behaves **exactly as today**.
  - Must be a strict JSON boolean. Any other value answers `400` with `{ "message": "..." }` and creates no session.
- When `keepSignedIn` is `true`:
  - the session's `expiration` is `Settings.long_session_period.from_now` (default 30 days);
  - the signed `session` cookie is **persistent**, with `expires` equal to the session's `expiration`.
- The response body is unchanged (the `Session` decorator: `expiration`, `token`).
- Unchanged: existing sessions, `Settings.session_period`, bearer-token auth, and logoff (`DELETE /users/logoff`).

## Solution
### Backend
- `source/app/models/settings.rb`: add `setting_with_options(:long_session_period, default: 30.days, type: :seconds)`, next to `session_period`.
- `LoggedUser::Processor#login(user)` (`source/app/controllers/concerns/logged_user/processor.rb`) takes a keep-signed-in option (e.g. `login(user, keep_signed_in: false)`):
  - the session expiration uses `long_session_period` when it's true, and `session_period` otherwise;
  - when it's true, the signed cookie is written as `{ value: id, expires: session.expiration }`.
  - #394 calls the same method with the request's `keep_signed_in` column.
- The login controller permits `keepSignedIn`, validates it as a strict boolean (`400` + `{ message }` otherwise, before any session is created) and passes it to the processor.

### Frontend
- The login modal's password form gets the checkbox. The controller/client send `keepSignedIn: Boolean(value)` inside `login`, and clearing the modal resets it.

### Tests
- RSpec:
  - the setting's default;
  - the processor with both values: expiration and cookie expiry;
  - the controller with `true`, `false`, a missing param and an invalid value (`400`, no session).
- Jasmine: the modal controller, helper and client (checkbox state, the payload, reset on clear).

### Agents
backend, frontend.

## Benefits
- Users can stay logged in across browser restarts on trusted devices.
- Provides the single session-minting path that device authorization (#394) reuses, so both flows produce identical sessions and cookies.
