# Migration and AuthorizationRequest model
Create the `authorization_requests` table per `data-model.md`:
`uuid` string(36) not null (unique index), `user_id` bigint nullable (FK to `users`), `login` string not null, `poll_token_digest` string(64) not null, `status` string not null default `'open'`, `keep_signed_in` boolean not null default `false`, `request_ip` string, `request_user_agent` string(512), `expires_at` datetime not null, timestamps. Index `(user_id, status)`; add an index on `(request_ip, created_at)` for the rate limit. Regenerate `db/schema.rb`.

`AuthorizationRequest` model (`belongs_to :user, optional: true`):
- `STATUSES = %w[open approved logged denied expired]`, validated inclusion.
- `before_validation` on create: `uuid ||= SecureRandom.uuid`, `expires_at ||= Settings.authorization_request_period.from_now`, truncate `request_user_agent` to 512.
- Token helpers: a class method building a new token (`SecureRandom.urlsafe_base64(32)`) and assigning `poll_token_digest = Digest::SHA256.hexdigest(token)`; an instance `poll_token?(token)` comparing hex digests with `ActiveSupport::SecurityUtils.secure_compare` (false for blank token).
- `expired?` / `current_status`: `open`/`approved` with `expires_at <= now` → `'expired'`; otherwise `status`. Optionally persist `expired` lazily.
- Scopes: `open_for(user)` (status `open`, not expired, oldest first), `created_by_ip_since(ip, time)`.
- `claim!`: atomic `self.class.where(id:, status: 'approved').where('expires_at > ?', Time.zone.now).update_all(status: 'logged', updated_at: now) == 1`.
- Cap: a class-level helper that, for a known user, expires the oldest open requests so at most `Settings.authorization_request_max_open` remain open after the new one is created.

Add a factory and model specs: defaults, digest (raw token never stored), `poll_token?`, expiry on read for `open` and `approved`, `claim!` returns true once and false afterwards (and false when expired), cap eviction of the oldest open request, user-agent truncation.

## Files to Change
- `source/db/migrate/<timestamp>_create_authorization_requests.rb` — new table and indexes.
- `source/db/schema.rb` — regenerated.
- `source/app/models/authorization_request.rb` — new model.
- `source/app/models/user.rb` — `has_many :authorization_requests` (optional, if useful).
- `source/spec/support/factories/authorization_request.rb` — factory.
- `source/spec/models/authorization_request_spec.rb` — model specs.
