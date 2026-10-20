# Issue: Device authorization: backend requester endpoints (create and poll)

## Description
Part of Epic #391 (device authorization login). A logged-out device (the **requester**) creates an authorization request with only a `login`, then polls it until a logged-in device approves or denies it. This sub-issue builds the backend for the requester side: the `authorization_requests` table and model, the public `create` and `poll` endpoints, their settings, and the audit logs.

Source of truth: `docs/agents/specs/authorization/` — `http-contract.md` (create, poll), `status-machine.md`, `data-model.md`, `security.md`. Where this issue and the specs disagree, the specs win.

Depends on #393: the winning poll mints the session through `LoggedUser::Processor#login(user, keep_signed_in:)`, which #393 adds.

## Expected Behavior
### Data model
- New table `authorization_requests` exactly as in `data-model.md`: `uuid` (string(36), random UUIDv4, unique index), `user_id` (nullable FK to `users`; `NULL` when the login matches no user), `login` (as typed), `poll_token_digest` (hex SHA256 of the `pollToken`; the token itself is never stored), `status` (default `open`), `keep_signed_in` (default `false`), `request_ip`, `request_user_agent` (truncated to 512 chars), `expires_at`, timestamps. Index on `(user_id, status)`; whether `(request_ip, created_at)` gets an index is left to the implementation.
- `AuthorizationRequest` model with the statuses `open`, `approved`, `logged`, `denied`, `expired`. Expiry is **computed on read**: `open`/`approved` with `expires_at <= now` counts as `expired` (it may be persisted lazily; no job).
- Migrations only add things.

### Settings
Added to `Settings` with `setting_with_options`:

| Setting | Type | Default |
|---|---|---|
| `authorization_request_period` | `:seconds` | `1.hour` |
| `authorization_request_create_limit` | `:integer` | `5` |
| `authorization_request_create_window` | `:seconds` | `1.minute` |
| `authorization_request_max_open` | `:integer` | `5` |

### `POST /auth/authorization-requests.json` (public)
- Body `{ login, keepSignedIn }`; `keepSignedIn` optional (default `false`).
- `200` `{ uuid, pollToken, expiresAt }` — **identical** whether the login exists or not. `pollToken` is `SecureRandom.urlsafe_base64(32)` (or longer) and is returned only here.
- `400` `{ message }` when `login` is missing/blank or `keepSignedIn` is present and not a strict boolean; nothing is created.
- `429` `{ message }` when the request IP already has `>= authorization_request_create_limit` rows created within `authorization_request_create_window` (unknown logins count too); nothing is created.
- For a known user, creating a request beyond `authorization_request_max_open` open requests expires the user's **oldest** open request.

### `POST /auth/authorization-requests/:uuid/poll.json` (public)
- Body `{ pollToken }`. Unknown `uuid`, missing or wrong token → `404` `{ message }`. The token is compared with the stored digest in constant time (`ActiveSupport::SecurityUtils.secure_compare` on hex digests).
- `200` `{ status }` with `open`, `denied`, `expired` or `logged`.
- The **first** poll that sees `approved` claims it atomically with one conditional update (`approved → logged` where `status = 'approved'`); the winner mints a regular session through `LoggedUser::Processor` honoring the request's `keep_signed_in`, sets the signed `session` cookie, and answers `{ status: "approved", session }` (`session` has the `Session` decorator shape: `expiration`, `token`). Every other poll gets `{ status: "logged" }` with no cookie.
- An `approved` request past `expires_at` answers `expired`.

### Common rules
- Both endpoints are `POST`, camelCase JSON, ISO 8601 UTC timestamps, and are exempt from CSRF (`protect_from_forgery except:`).
- Every response, success or error, **always** carries `X-Skip-Cache: true` (not only when a session cookie exists).
- Audit logs at `info` through `Rails.logger` for "request created" and "session minted", with IP and user id (`nil` for unknown logins); never the `pollToken`.

### Out of scope
`mine`, `authorize`, `deny` and the password lockout (#395); all frontend work (#396, #397); cleanup of old requests.

## Solution
- Migration + `AuthorizationRequest` model (+ decorator for the create response) under `source/app/models`.
- A new controller (e.g. `Auth::AuthorizationRequestsController`) with `create` and `poll`, routes under `/auth/authorization-requests`.
- Settings in `source/app/models/settings.rb`.
- Reuse `LoggedUser::Processor#login(user, keep_signed_in:)` from #393 to mint the session.

### Tests
RSpec for the model (status transitions, expiry on read, open-request cap, digest) and for the controller (contract and status codes, identical response for unknown logins, `404`s, the atomic claim — only one winner, cookie and keep-signed-in expiry, `X-Skip-Cache` on every response, rate limit `429`, strict-boolean `400`).

### Agent
backend
