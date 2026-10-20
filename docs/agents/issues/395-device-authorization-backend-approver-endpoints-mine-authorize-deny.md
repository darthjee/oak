# Issue: Device authorization: backend approver endpoints (mine, authorize, deny)

## Description
Part of Epic #391 (device authorization login). A logged-in device (the **approver**) lists its user's open authorization requests and authorizes them (re-entering the password) or denies them. This sub-issue builds the approver-side backend on top of the `AuthorizationRequest` model and `Auth::AuthorizationRequestsController` delivered by #394 (requester endpoints, merged).

Source of truth: `docs/agents/specs/authorization/`, mainly `http-contract.md` (mine, authorize and deny), `data-model.md` (lockout columns and settings), `status-machine.md` and `security.md` (audit logging).

## Problem
A requester can create and poll an authorization request (#394), but nothing can move a request out of `open`. Logged-in users have no way to see, approve or deny requests for their account, so the flow can never complete.

## Expected Behavior
All three endpoints follow the common rules in `http-contract.md`:
- `POST`, JSON body, camelCase keys, ISO 8601 UTC timestamps;
- every response, success or error, carries `X-Skip-Cache: true`;
- CSRF is exempted (`protect_from_forgery except:`);
- error bodies are `{ message }`.

### `POST /auth/authorization-requests/mine.json` — body `{}`
- `200 { requests: [{ uuid, requestIp, requestUserAgent, createdAt, expiresAt, keepSignedIn }] }`.
- Only the logged user's requests that are `open` and not expired, **newest first**.
- No requests → `{ "requests": [] }`.

### `POST /auth/authorization-requests/:uuid/authorize.json` — body `{ password }`
- `200 { authorized: true }`; the request moves `open → approved`, and the next poll from #394 claims it.

### `POST /auth/authorization-requests/:uuid/deny.json` — body `{}`
- `200 { denied: true }`; the request moves `open → denied`.

### Errors (checks run in this order)
| Outcome | Status |
|---|---|
| Logged out (no active session from the signed `session` cookie or `Authorization: Bearer`) | `401 { message }` |
| Unknown `uuid`, or the request belongs to another user or to no user | `400 { message }` |
| Request not `open`, or expired (expiry computed on read) | `400 { message }` |
| `authorize` only: user locked (`authorization_locked_until > now`) | `400 { message }` |
| `authorize` only: wrong password (counts toward the lockout) | `400 { message }` |

- These endpoints never answer `403` or `404` for business errors.
- `401` applies **only** to these three endpoints. Existing endpoints keep their behavior: `LoggedUser` answers `404` and `UserRequired` redirects.

### Wrong-password lockout (stored in the DB)
- **New `users` columns:**
  - `authorization_failed_attempts`: integer, not null, default `0`;
  - `authorization_locked_until`: datetime, nullable.
- **New settings,** via `setting_with_options` in `Settings`:
  - `authorization_request_max_attempts`: `:integer`, default `5`;
  - `authorization_request_lock_period`: `:seconds`, default `5.minutes`.
- **Wrong password:** increments the counter. When it reaches `max_attempts`, set `authorization_locked_until = now + lock_period` and reset the counter to `0`.
- **Successful authorize:** resets the counter to `0`.
- **While locked:** every `authorize` answers `400` (locked) **without checking the password**.
- **After `authorization_locked_until` passes:** authorizing works again.
- **Scope:** the lockout affects only `authorize`. Password login and `deny` are unaffected.

### Audit logs
Log at `info` through `Rails.logger`, reusing the `[authorization_request]` log format from #394. Each line includes the request IP and the user id, and never the password or the poll token. Events:
- request approved;
- request denied;
- wrong password;
- lockout triggered.

## Solution
- **Migration:** add the two lockout columns to `users`.
- **Settings:** add the two settings, with specs using the settings shared examples.
- **Model, status changes:** `authorize` and `deny` change status with a **conditional update**, `where(status: 'open').not_expired`, using `AuthorizationRequest.transition_all`. The affected-row count decides success, so a concurrent authorize/deny, or a request that expired between the check and the write, ends in a `400` instead of a double transition. This mirrors `claim!`.
- **Model, lockout:** a small `User` lockout helper (`authorization_locked?`, register a failure, reset) wraps the counter rules. The password check reuses `User#verify_password!`, rescuing `Oak::Exception::LoginFailed`.
- **Routes:** add `mine` (collection), `authorize` and `deny` (member) under the existing `auth` namespace route for `authorization-requests`.
- **Controller:** extend `Auth::AuthorizationRequestsController`, or a sibling controller in `Auth::` if that reads cleaner; this is left to the plan.
  - Resolve the logged user through `LoggedUser::Processor`.
  - Map logged out to `401` and business errors to `400` with `{ message }`.
  - Keep `force_skip_cache_header` on every action and extend the CSRF exemption list.
- **Serialization:** the `mine` list uses a decorator that exposes the fields listed above. It must never expose `pollToken`/`poll_token_digest`, `id`, `user_id` or `login`.
- **Tests:** RSpec for the model (transitions, lockout rules) and request specs for each endpoint, covering:
  - success;
  - `401`;
  - each `400` case, in check order;
  - the lockout trigger, the lock blocking a correct password, and the lock expiring;
  - the counter reset on success;
  - `mine` returning only the caller's open, unexpired requests, newest first;
  - `X-Skip-Cache` on every response.

Out of scope: the frontend (Authorizations page #398, event bus/dropdown #396), user deactivation, request cleanup, and unifying `401` across existing endpoints.

Agent: backend.

## Benefits
Completes the server side of the device authorization flow. Once this lands, a logged-in device can approve a sign-in, the requester's poll (#394) gets a session, and #398 can build the Authorizations page against a working API. The DB-backed lockout limits password brute force on the approver side, even without a shared cache store.
