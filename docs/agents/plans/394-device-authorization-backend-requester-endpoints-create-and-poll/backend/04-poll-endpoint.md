# Poll endpoint and atomic claim
Add `POST /auth/authorization-requests/:uuid/poll.json` (public) per `http-contract.md` and `status-machine.md`.

- Find by `uuid`; unknown uuid, missing or wrong `pollToken` (`poll_token?`) → `404 { message }` (same message for all three, no hint which).
- Compute the current status on read (`expired` when past `expires_at`).
- When the current status is `approved`: call `claim!`. If it wins, mint the session with `logged_user_processor.login(request.user, keep_signed_in: request.keep_signed_in)` (include `LoggedUser`, or instantiate `LoggedUser::Processor`), and answer `{ status: 'approved', session: Session::Decorator.new(session) }` with the signed `session` cookie. If it loses, answer `{ status: 'logged' }` with no cookie.
- Otherwise answer `{ status: <current status> }` (`open`, `denied`, `expired`, `logged`).
- Audit log: `Rails.logger.info` "authorization request session minted" with uuid, IP and user id on the winning poll; never the token.
- `X-Skip-Cache: true` on every response, including `404`.

Controller specs: `404` for unknown uuid, missing token and wrong token; `open`, `denied`, `expired` (both open and approved past expiry), `logged`; the winning poll gets `approved` + session body + signed cookie, and a second poll gets `logged` with no cookie; `keep_signed_in` true → session expiration ≈ `Settings.long_session_period` and persistent cookie, false → `Settings.session_period`; `X-Skip-Cache` on 200 and 404; no `LoggedUser` 404 rescue leaking (the requester has no session).

## Files to Change
- `source/config/routes.rb` — `poll` member route (if not added in step 03).
- `source/app/controllers/auth/authorization_requests_controller.rb` — `poll` action.
- `source/spec/controllers/auth/authorization_requests_controller_spec.rb` — poll specs.
