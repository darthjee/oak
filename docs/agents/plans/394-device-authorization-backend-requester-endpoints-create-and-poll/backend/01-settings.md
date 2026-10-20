# Settings
Add the four requester settings with `setting_with_options`, exactly as in `docs/agents/specs/authorization/data-model.md`:

- `authorization_request_period` — `:seconds`, default `1.hour`
- `authorization_request_create_limit` — `:integer`, default `5`
- `authorization_request_create_window` — `:seconds`, default `1.minute`
- `authorization_request_max_open` — `:integer`, default `5`

Cover the defaults and env/db overrides in the settings spec, following the existing examples (shared examples in `spec/support/shared_examples/settings.rb`).

## Files to Change
- `source/app/models/settings.rb` — add the four settings.
- `source/spec/models/settings_spec.rb` — specs for the new settings.
