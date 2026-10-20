# Data model and keep signed in

## `data-model.md`

- **New table** `authorization_requests`. Fix the columns and types exactly:
  - `uuid` (string, unique, random UUIDv4);
  - `user_id` (nullable: the login may be unknown);
  - `login` as typed;
  - `poll_token_digest` (SHA256, compared in constant time);
  - `status` (string, one of the five states);
  - `keep_signed_in` (boolean);
  - `request_ip`;
  - `request_user_agent`;
  - `expires_at`;
  - timestamps.
- **Indexes:** a unique index on `uuid`, and an index on `(user_id, status)`. Other index choices are left to #394.
- **Lockout storage.** It lives in the DB, not the Rails cache, because Oak has no shared cache store. Store a failed-attempts counter and `locked_until` per user, on `users` or a dedicated table. Pick one and state it exactly, because #395 owns it but the setting names are shared.
- **Create rate limit.** It counts recent rows per `request_ip` in `authorization_requests`.
- **`sessions` column.** Add one only if it is needed to record "keep signed in", and state the decision.
- **Settings.** Add these to `Settings` (Sinclair `setting_with_options`, `:seconds` / `:integer` types, env and db sources). Fix the names and defaults exactly. Suggested:
  - `long_session_period`: 30 days, an assumption to confirm in #393;
  - `authorization_request_period`: 1 hour;
  - `authorization_request_create_limit`: 5;
  - `authorization_request_create_window`: 1 minute;
  - `authorization_request_max_open`: 5;
  - `authorization_request_max_attempts`: 5;
  - `authorization_request_lock_period`: 5 minutes.
- **Schema changes only add things.** Nothing is renamed or removed, and there is no data migration.

## `keep-signed-in.md`

- **Today:** a signed `session` cookie with no expiry (it lasts for the browser session), and a server-side expiry of `Settings.session_period`.
- **New:** an optional "Keep me signed in" checkbox on the password form.
  - `POST /users/login.json` accepts an optional boolean `keepSignedIn` (strict boolean; state where it sits in the `{ login: { ... } }` body). It defaults to `false`, which behaves exactly as today.
  - When it is `true`, the session expires after `Settings.long_session_period`, and the cookie is persistent with a matching expiry.
- **The same option applies to device authorization.** The requester chooses it, and the approver sees it as a badge.
- **Unchanged:** existing sessions, Bearer-token login and logoff.

## Files to Change
- `docs/agents/specs/authorization/data-model.md` — new.
- `docs/agents/specs/authorization/keep-signed-in.md` — new.
