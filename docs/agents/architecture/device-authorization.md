# Device Authorization

"Authorize with logged device": a user logs in on a new device by typing only their `login`. A
device where the same user is already logged in approves the request by re-entering its own
password, or denies it. The new device polls the request and, once approved, receives a regular
Oak session.

- Endpoints: [Utility Routes — Device Authorization](../routes/utility-routes.md#device-authorization).
- Frontend: [Login Modal and Device Authorization](../frontend/login-and-device-authorization.md).

## Roles

- **Requester**: the new, logged-out device. In the login modal it picks the **device** mode,
  types its `login`, may tick "Keep me signed in", then waits while polling every 5 seconds.
- **Approver**: a device logged in as the same user. It opens **Account → Authorizations**
  (`#/authorizations`) and authorizes (with its password) or denies each pending request. It sees
  the requester's IP, User-Agent, age, expiry and a "Keep signed in" badge, and cannot change them.

## Flow

```text
Requester                         Backend                           Approver
POST /auth/authorization-requests ──▶ request created (open)
  ◀── { uuid, pollToken, expiresAt }
every 5s: POST .../:uuid/poll ──▶ { status: "open" }
                                     ◀── POST .../mine              (Refresh)
                                     ◀── POST .../:uuid/authorize   { password }
                                         request → approved
POST .../:uuid/poll ──▶ request → logged, Session created
  ◀── { status: "approved", session } + signed `session` cookie
```

Deny instead makes the next poll answer `{ status: "denied" }`.

## Status machine

| Status | Meaning |
|---|---|
| `open` | Waiting for an approver. |
| `approved` | Authorized; no poll has claimed it yet. |
| `logged` | A poll claimed the approval and a session was created. Final. |
| `denied` | Denied by the approver. Final. |
| `expired` | `expires_at` passed, or evicted by the open-request cap. Final. |

Transitions: `open → approved` (authorize), `open → denied` (deny), `open → expired`, and
`approved → logged` (first poll). Every other transition is invalid.

- **Expiry is computed on read** (`AuthorizationRequest#current_status`): an `open` or `approved`
  row past `expires_at` counts as `expired` everywhere. No background job.
- **Atomic claim**: `claim!` is one conditional update `approved → logged`; only the poll that
  wins it mints the session. Every later poll answers `{ status: "logged" }` with no cookie.

## Data model and settings

`authorization_requests` (model `AuthorizationRequest`):

| Column | Notes |
|---|---|
| `uuid` | Random UUIDv4, unique index. Identifies the request in URLs. |
| `user_id` | Nullable: `NULL` when the typed login matches no user (the request just expires). |
| `login` | The login as typed. |
| `poll_token_digest` | SHA256 hex of the `pollToken`; the token itself is never stored. |
| `status` | `open` (default), `approved`, `logged`, `denied`, `expired`. |
| `keep_signed_in` | Chosen by the requester, used when the session is minted. |
| `request_ip`, `request_user_agent` | Shown to the approver. User-Agent truncated to 512 chars. |
| `expires_at` | `created_at + Settings.authorization_request_period`. |

Indexes: `uuid` (unique), `(user_id, status)`, `(request_ip, created_at)`.

Lockout columns on `users`: `authorization_failed_attempts` (default `0`) and
`authorization_locked_until`. A wrong password on `authorize` increments the counter; reaching
the max attempts locks `authorize` for the lock period and resets it. A success resets it too.
The lockout only affects `authorize`. It lives in the database because Oak has no shared cache
store in production.

Settings (`source/app/models/settings.rb`):

| Setting | Default | Meaning |
|---|---|---|
| `long_session_period` | `30.days` | Session length with "Keep me signed in". |
| `authorization_request_period` | `1.hour` | Request lifetime. |
| `authorization_request_create_limit` | `5` | Max creates per IP per window (`429` beyond). |
| `authorization_request_create_window` | `1.minute` | Rate-limit window. |
| `authorization_request_max_open` | `5` | Max open requests per user; the oldest expires beyond it. |
| `authorization_request_max_attempts` | `5` | Wrong passwords before the authorize lockout. |
| `authorization_request_lock_period` | `5.minutes` | Authorize lockout length. |

## Keep me signed in

Both password login (`keepSignedIn` on `POST /users/login`) and device authorization (the
request's `keep_signed_in`) mint the session through
`LoggedUser::Processor#login(user, keep_signed_in:)`. When it is `true`, the session expires after
`Settings.long_session_period` and the signed `session` cookie is persistent, expiring with the
session. Otherwise the session uses `Settings.session_period` (default 2 days) and a
browser-session cookie. `sessions` has no extra column.

## Security

| Threat | Mitigation |
|---|---|
| Login enumeration | `create` answers the same `200` for known and unknown logins; the UI always shows the waiting panel. |
| Token leakage | `pollToken` is long, random, returned once, kept in memory only and stored as a digest compared in constant time. Polling needs both `uuid` and `pollToken`. |
| Create flooding | Per-IP rate limit and per-user open-request cap. |
| Approver password brute force | Per-user lockout on `authorize`. |
| Caching | Every endpoint always answers `X-Skip-Cache: true`. |
| CSRF | Exempt JSON POSTs, as elsewhere in Oak; authorizing needs the password. |
| Phishing | Password required to approve; rows show IP, User-Agent and age; the page warns to approve only requests you started. |
| Session reuse | Only the first poll after approval gets a session (atomic claim). |

Audit events (created, session minted, approved, denied, wrong password, lockout) are logged at
`info` with the uuid, IP and user id, never the token or password
(`AuthorizationRequestEndpoint#log_event`).

Out of scope: user deactivation, a confirmation code shown on both devices, cleanup of old
finished requests, rate limiting of password login, and unifying every logged-out response as `401`.
