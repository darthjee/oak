# Backend Plan: Keep me signed in for password login

Main plan: [plan.md](plan.md)

## Shared contracts

- `POST /users/login.json` accepts an optional `login.keepSignedIn`. It must be a strict
  boolean; a missing value means `false`. Any non-boolean value answers `400` with
  `{ "message": "<text>" }` and creates no session.
- `true`:
  - `Session#expiration = Settings.long_session_period.from_now` (setting type `:seconds`,
    default `30.days`);
  - the signed `session` cookie is written with `expires: session.expiration`.
- `false` or missing: exactly today's behavior.
- The response body is unchanged.

## Steps

- [01 — Add the long_session_period setting](backend/01-long-session-period-setting.md)
- [02 — Keep-signed-in option in LoggedUser::Processor#login](backend/02-processor-keep-signed-in.md)
- [03 — Accept and validate keepSignedIn in LoginController](backend/03-login-controller-param.md)

## CI Checks

- `source`: `bundle exec rspec` (CI job: RSpec) and `bundle exec rubocop` (CI job: Rubocop).

## Notes

- Keep `Processor#login(user)` callable with one argument (`keep_signed_in: false` default), so
  other callers and specs keep working. #394 will call `login(user, keep_signed_in: request.keep_signed_in)`.
- There is no existing `400` handling in the app. Keep it local to the login flow (a new
  `Oak::Exception` subclass rescued in `LoginController`, or a guard that renders the `400`
  directly). #394 needs the same validation on its own endpoint, so a small reusable helper is
  welcome but not required.
- Strict boolean means checking the raw JSON value with `[true, false].include?(value)`, not
  casting it with `ActiveModel::Type::Boolean`.
