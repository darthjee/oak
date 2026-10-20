# Request transitions and list decorator
Add the approver-side model behavior to `AuthorizationRequest`, plus a decorator for the `mine` list.

- **Transitions:** `authorize!` (`open → approved`) and `deny!` (`open → denied`).
  - Each uses a single conditional update, `self.class.where(id:, status: 'open').not_expired`, through `transition_all`, mirroring `claim!`.
  - Each returns `true` only when exactly one row changed. That way a concurrent authorize/deny, or a request that expired between the controller's check and the write, is reported as a failure (the controller answers `400`).
  - Reload or set `status` on success so the in-memory object matches the DB.
- **Ownership and listing:**
  - A scope or class method for the approver list: the user's requests with `status: 'open'`, `not_expired`, ordered **newest first** (`created_at: :desc, id: :desc`). The existing `open_for` orders oldest first for the cap, so add a separate scope (e.g. `pending_for(user)`) rather than changing `open_for`.
  - Optionally `belongs_to?(user)` / `owned_by?(user)` (`user_id.present? && user_id == user.id`) for the controller's ownership check.
- **Decorator:** `AuthorizationRequest::ListDecorator` (an `Azeroth::Decorator`, next to the existing `Decorator`). It exposes:
  - `uuid`;
  - `request_ip` as `requestIp`;
  - `request_user_agent` as `requestUserAgent`;
  - `created_at` as `createdAt`;
  - `expires_at` as `expiresAt`;
  - `keep_signed_in` as `keepSignedIn`.

  Timestamps use `.utc.iso8601(3)`, as in the existing decorator. It must not expose `pollToken`, `poll_token_digest`, `id`, `user_id`, `login` or `status`.

Specs:
- **Model** (`spec/models/authorization_request_spec.rb`):
  - `authorize!` and `deny!` succeed from `open`;
  - they fail and leave the row unchanged from `approved`/`denied`/`logged`/`expired` and from an open request past `expires_at`;
  - the new scope returns only the user's open, unexpired requests, newest first, and excludes other users' requests and requests without a user.
- **Decorator** (`spec/models/authorization_request/list_decorator_spec.rb`): exact key set and ISO 8601 formatting, following `decorator_spec.rb`.

## Files to Change
- `source/app/models/authorization_request.rb` — `authorize!`, `deny!`, list scope, ownership helper.
- `source/app/models/authorization_request/list_decorator.rb` — new decorator.
- `source/spec/models/authorization_request_spec.rb` — transition and scope specs.
- `source/spec/models/authorization_request/list_decorator_spec.rb` — new spec.
