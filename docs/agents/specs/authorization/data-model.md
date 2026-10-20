# Data Model

Part of the [device authorization spec](../authorization.md). Used by #393, #394 and #395.

All schema changes **only add things**. Nothing is renamed or removed, and there is no data
migration. Index choices beyond those listed and migration details are left to each sub-issue.

## `authorization_requests` (new table, #394)

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | bigint PK | no | Internal only; never exposed. |
| `uuid` | string(36) | no | Random UUIDv4 (`SecureRandom.uuid`). Unique. Exposed as `uuid`. |
| `user_id` | bigint FK → `users` | **yes** | `NULL` when the typed login matches no user. |
| `login` | string | no | The login exactly as typed by the requester. |
| `poll_token_digest` | string(64) | no | Hex SHA256 of the `pollToken`. The token itself is never stored. |
| `status` | string | no | One of `open`, `approved`, `logged`, `denied`, `expired` (see [status-machine.md](status-machine.md)). Default `open`. |
| `keep_signed_in` | boolean | no | Default `false`. Exposed as `keepSignedIn`. |
| `request_ip` | string | yes | Requester IP (`request.remote_ip`). Exposed as `requestIp`. |
| `request_user_agent` | string(512) | yes | Requester `User-Agent`, truncated to 512 chars. Exposed as `requestUserAgent`. |
| `expires_at` | datetime | no | `created_at + Settings.authorization_request_period`. Exposed as `expiresAt`. |
| `created_at` / `updated_at` | datetime | no | `created_at` exposed as `createdAt`. |

Indexes:

- unique index on `uuid` (each poll is one indexed lookup);
- index on `(user_id, status)` (the approver's `mine` list and the open-request cap);
- the per-IP rate limit counts by `(request_ip, created_at)`; whether it gets its own index is
  left to #394.

`pollToken` generation: `SecureRandom.urlsafe_base64(32)` or longer. It is compared with its
digest in constant time (`ActiveSupport::SecurityUtils.secure_compare` on the hex digests).

## Lockout columns on `users` (new columns, #395)

The approver-password lockout is stored **in the database**, because Oak has no shared Rails
cache store in production.

| Column | Type | Null | Notes |
|---|---|---|---|
| `authorization_failed_attempts` | integer | no | Default `0`. Wrong passwords on `authorize` since the last success or lock. |
| `authorization_locked_until` | datetime | yes | While `> now`, every `authorize` by this user answers `400` (locked) without checking the password. |

Rules:

- A wrong password increments `authorization_failed_attempts`. When it reaches
  `Settings.authorization_request_max_attempts`, set
  `authorization_locked_until = now + Settings.authorization_request_lock_period` and reset the
  counter to `0`.
- A successful `authorize` resets the counter to `0`.
- The lockout only affects `authorize`. Password login and `deny` are unaffected.

## Create rate limit (#394)

Counted from `authorization_requests` itself: the number of rows with the same `request_ip` and
`created_at > now - Settings.authorization_request_create_window`. When it is already
`>= Settings.authorization_request_create_limit`, `create` answers `429` and creates nothing.
Requests for unknown logins count too.

## `sessions`

**No new column.** "Keep me signed in" only changes the `expiration` written when the session is
created and the cookie's expiry, both derived at creation time (see
[keep-signed-in.md](keep-signed-in.md)). Nothing needs to be remembered afterwards.

## Settings

Added to `Settings` (`source/app/models/settings.rb`) with `setting_with_options`, so they read
from the env and db sources like the existing ones. Names, types and defaults are fixed:

| Setting | Type | Default | Owner | Meaning |
|---|---|---|---|---|
| `long_session_period` | `:seconds` | `30.days` | #393 | Session length when "Keep me signed in" is ticked. |
| `authorization_request_period` | `:seconds` | `1.hour` | #394 | Request lifetime (`expires_at`). |
| `authorization_request_create_limit` | `:integer` | `5` | #394 | Max creates per IP per window. |
| `authorization_request_create_window` | `:seconds` | `1.minute` | #394 | Rate-limit window. |
| `authorization_request_max_open` | `:integer` | `5` | #394 | Max open requests per user; the oldest is expired beyond it. |
| `authorization_request_max_attempts` | `:integer` | `5` | #395 | Wrong passwords before the authorize lockout. |
| `authorization_request_lock_period` | `:seconds` | `5.minutes` | #395 | Authorize lockout length. |

`Settings.session_period` (default `2.days`) is unchanged and still applies to every session
created without "Keep me signed in".
