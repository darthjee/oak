# User lockout rules
Encapsulate the lockout rules on `User` so the controller only asks questions and reports outcomes.

Suggested API (names may be adjusted to read well):
- `authorization_locked?` returns true while `authorization_locked_until` is present and `> Time.zone.now`.
- `register_authorization_failure!` increments `authorization_failed_attempts`. When the counter reaches `Settings.authorization_request_max_attempts`:
  - set `authorization_locked_until = Settings.authorization_request_lock_period.from_now`;
  - reset the counter to `0`.

  Return whether this call triggered the lock, so the controller can log "lockout triggered".
- `reset_authorization_failures!` sets the counter to `0`. Call it on a successful authorize.

Password checking reuses `User#verify_password!` (it raises `Oak::Exception::LoginFailed`). Don't add a second hashing path.

The lockout must not affect `User.login` (password login) or anything else.

Specs in `spec/models/user_spec.rb`:
- `authorization_locked?` is false by default, true while the lock is in the future, and false once it has passed (use `travel_to`/`freeze_time`, or set the column directly);
- a failure below the threshold only increments;
- the failure that reaches the threshold locks for `lock_period` and resets the counter;
- a reset zeroes the counter;
- the thresholds come from the settings (stub `Settings` to non-default values to prove it).

## Files to Change
- `source/app/models/user.rb` — lockout helper methods.
- `source/spec/models/user_spec.rb` — lockout specs.
