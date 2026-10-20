# Create endpoint
Add `POST /auth/authorization-requests.json` (public) per `http-contract.md`.

- Routes: `namespace :auth do resources :authorization_requests, path: 'authorization-requests', param: :uuid, only: :create do member { post :poll } end end` (poll is wired in step 04; check `rails routes` gives `/auth/authorization-requests.json` and `/auth/authorization-requests/:uuid/poll.json`).
- `Auth::AuthorizationRequestsController < ApplicationController`, `protect_from_forgery except: %i[create poll]`, and an `after_action` (or `before_action` setting the header up front so error renders keep it) that **always** sets `X-Skip-Cache: true`.
- Validation: `login` missing/blank → `400 { message }`; `keepSignedIn` present and not `true`/`false` → `400 { message }` (reuse the `LoginController` strict-boolean approach and `Oak::Exception::InvalidParameter`). Accept params at the top level (`{ login, keepSignedIn }`).
- Rate limit: if `AuthorizationRequest.created_by_ip_since(request.remote_ip, Settings.authorization_request_create_window.ago).count >= Settings.authorization_request_create_limit` → `429 { message }`, nothing created.
- Create: `user = User.find_by(login:)` (may be nil); save the row with `login`, `user`, `keep_signed_in`, `request_ip`, `request_user_agent`, digest; apply the per-user open cap when `user` is present (in a transaction).
- Response `200 { uuid, pollToken, expiresAt }` (camelCase, ISO 8601 UTC), identical for known and unknown logins.
- Audit log: `Rails.logger.info` "authorization request created" with uuid, IP and user id (nil for unknown); never the token.

Controller specs: success shape for known and unknown logins (same keys, user_id nil for unknown), `400` cases (blank login, `keepSignedIn: "true"`), `429` after the limit (unknown logins count), cap expiring the oldest open request, `X-Skip-Cache: true` on 200, 400 and 429, digest stored and not the token. Routing spec for both routes.

## Files to Change
- `source/config/routes.rb` — `auth` namespace routes.
- `source/app/controllers/auth/authorization_requests_controller.rb` — new controller (`create`).
- `source/spec/controllers/auth/authorization_requests_controller_spec.rb` — create specs.
- `source/spec/routing/auth/authorization_requests_routing_spec.rb` — routing specs.
