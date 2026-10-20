# Add the long_session_period setting

Add `setting_with_options(:long_session_period, default: 30.days, type: :seconds)` to
`Settings`, right after `session_period`. Like the other settings, it can be overridden by env or
the DB (`ActiveSettings`).

Cover it in `settings_spec.rb` with the same `it_behaves_like 'a setting'` shape that
`.session_period` uses (default `30.days`, overridable).

## Files to Change

- `source/app/models/settings.rb` — the new setting.
- `source/spec/models/settings_spec.rb` — a `.long_session_period` block.
