# Keep-signed-in option in LoggedUser::Processor#login

Change `LoggedUser::Processor#login(user)` to `login(user, keep_signed_in: false)`:

- `new_session` sets the expiration to `Settings.long_session_period.from_now` when
  `keep_signed_in` is true, and to `Settings.session_period.from_now` otherwise.
- When `keep_signed_in` is true, it writes
  `signed_cookies[SESSION_KEY] = { value: session.id, expires: session.expiration }`. Otherwise
  it writes the plain id, as today.

Update `LoggedUser#save_session` (in the concern) so it can forward the option. For example, it
could call `logged_user_processor.login(user, keep_signed_in:)` with `keep_signed_in` taken from
a controller method that defaults to `false`.

Specs in `processor_spec.rb`, for both values:

- the session expiration falls in the expected range;
- the cookie's `expires` is set only when the value is true (check the `Set-Cookie` header or
  `cookies` jar);
- the default call (no option) behaves as today.

## Files to Change

- `source/app/controllers/concerns/logged_user/processor.rb` — the option, expiration and
  persistent cookie.
- `source/app/controllers/concerns/logged_user.rb` — forward the option from the controller.
- `source/spec/controllers/concerns/logged_user/processor_spec.rb` — new contexts.
