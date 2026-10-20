# Approver endpoints
Expose `mine`, `authorize` and `deny` under the existing `auth` routes, logged-in only.

## Routes
In `source/config/routes/auth.rb`:
- add `collection { post :mine }`;
- add `post :authorize` and `post :deny` to the existing `member` block.

The resulting paths:
- `POST /auth/authorization-requests/mine(.json)`
- `POST /auth/authorization-requests/:uuid/authorize(.json)`
- `POST /auth/authorization-requests/:uuid/deny(.json)`

Extend `spec/routing/auth/authorization_requests_routing_spec.rb`.

## Controller
Extend `Auth::AuthorizationRequestsController`. If it grows too large for rubocop's class-length limits, move the approver actions to a sibling `Auth::` controller with the same routes (via `controller:`) and duplicate the skip-cache/rescue setup.
- **CSRF:** add `mine authorize deny` to `protect_from_forgery except:`.
- **Skip-cache:** keep `force_skip_cache_header` running for every action. It already runs as a `before_action`; make sure error responses still carry it.
- **`401` when logged out:** add `before_action :check_logged!, only: %i[mine authorize deny]`. It raises `Oak::Exception::NotLogged` unless `session_processor.logged_user` is set, reusing the existing `session_processor`. Add `rescue_from Oak::Exception::NotLogged`, which renders `401 { message }`. The rescue is local to this controller, so existing endpoints keep their `404`/redirect behavior.
- **`400` for business errors:** reuse `Oak::Exception::InvalidParameter` → `bad_request`, or add a dedicated exception class if it reads better, still mapped to `400 { message }`. Never answer `404`/`403` from these actions.
- **Request lookup for `authorize`/`deny`**, in this order:
  1. Find by `uuid`. Missing, or not owned by the logged user (including `user_id: nil`) → `400`.
  2. Not `open`, or expired (`current_status != 'open'`) → `400`.
  3. `authorize` only: `logged_user.authorization_locked?` → `400` (locked), without checking the password.
  4. `authorize` only: `logged_user.verify_password!(params[:password])`. On `LoginFailed` (or a blank or non-string password), call `register_authorization_failure!`, log "wrong password" (plus "lockout triggered" when it returns true), then answer `400`.
  5. On success, call `reset_authorization_failures!`, then `authorize!` or `deny!`. If the conditional update returns false, answer `400` (the request is no longer open).
- **`mine`:** `render json: { requests: ListDecorator.new(scope) }`, or map each record, so an empty list is `{ "requests": [] }`.
- **`authorize`:** `render json: { authorized: true }`. **`deny`:** `render json: { denied: true }`.
- **Audit logs:** reuse `log_event` with `ip: request.remote_ip` (the approver's IP) and the user id. Events: `approved`, `denied`, `wrong password`, `lockout triggered`. Never log the password or the poll token.

## Specs
Use `spec/controllers/auth/authorization_requests_controller_spec.rb`, or a new file if a sibling controller is used. Log in with `controller.send(:cookies).signed[:session] = session.id`.
- **`mine`:**
  - `401` logged out;
  - the response contains only the caller's open, unexpired requests, newest first, with the exact key set;
  - `{ "requests": [] }` when there are none;
  - `X-Skip-Cache: true`.
- **`authorize`:**
  - success (`200 { authorized: true }`, status `approved`, counter reset);
  - `401`;
  - `400` for an unknown uuid, another user's request, a request without a user, each non-open status, and an open request past `expires_at`;
  - `400` while locked, even with the correct password, without changing the counter;
  - `400` for a wrong password, which increments the counter;
  - the 5th wrong password sets `authorization_locked_until`;
  - after the lock passes (`travel`), a correct password succeeds;
  - `X-Skip-Cache: true` on success and error.
- **`deny`:**
  - success (`200 { denied: true }`, status `denied`);
  - `401`;
  - each `400` ownership/status case;
  - deny works while the user is locked.
- **Logs:** an expectation on `Rails.logger` for approve, deny and the lockout, ideally also asserting the password isn't in the message.

## Files to Change
- `source/config/routes/auth.rb` — new collection and member routes.
- `source/app/controllers/auth/authorization_requests_controller.rb` — the new actions, `401`/`400` handling, logs (or a new sibling controller).
- `source/spec/routing/auth/authorization_requests_routing_spec.rb` — routing specs.
- `source/spec/controllers/auth/authorization_requests_controller_spec.rb` — endpoint specs.
