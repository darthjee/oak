# Accept and validate keepSignedIn in LoginController

`LoginController`:

- Read `params[:login][:keepSignedIn]`. Keep it out of `login_params`, because `User.login`
  only takes `login` and `password`.
- Validate it before `save_session` runs (for example in a `before_action` ordered before
  `save_session`, or inside `save_session`):
  - absent → `false`;
  - `true` / `false` → used as is;
  - anything else → `400` with `{ message: 'keepSignedIn must be a boolean' }`, and no session
    is created.
- Pass the value to the processor through the hook from step 02.

Request specs in `login_controller_spec.rb`, alongside the existing `POST create` contexts:

- `keepSignedIn: true` → `200`; the session expiration is within
  `long_session_period.from_now`; the cookie has `expires`.
- `keepSignedIn: false` and the param missing → today's expectations (`session_period`, no
  `expires`).
- An invalid value (e.g. `"yes"`) → `400`, a JSON `message`, and no `Session` created.
- Bad credentials with `keepSignedIn: true` → still `404`.

The specs must post a JSON body (`as: :json`) so booleans arrive as real booleans.

## Files to Change

- `source/app/controllers/login_controller.rb` — param read, validation and forwarding.
- `source/app/models/oak/exception.rb` — optionally an `InvalidParameter` exception for the
  `400`.
- `source/spec/controllers/login_controller_spec.rb` — new contexts.
