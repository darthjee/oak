# Lockout columns and settings
Add the persistence and configuration for the approver-password lockout. The lockout lives in the DB because Oak has no shared cache store in production.

- **Migration** (`ActiveRecord::Migration[7.2]`, timestamp after `20261020120000`): add to `users`:
  - `authorization_failed_attempts`: integer, `null: false`, `default: 0`;
  - `authorization_locked_until`: datetime, nullable.
  - Only add, never rename or remove. Regenerate `db/schema.rb`.
- **Settings** (`setting_with_options`, next to the other `authorization_request_*` lines):
  - `authorization_request_max_attempts`: `default: 5, type: :integer`;
  - `authorization_request_lock_period`: `default: 5.minutes, type: :seconds`.
- **Settings spec:** add `it_behaves_like 'a setting'` blocks for both, following the existing `authorization_request_*` examples.

## Files to Change
- `source/db/migrate/<timestamp>_add_authorization_lockout_to_users.rb` — new migration.
- `source/db/schema.rb` — regenerated.
- `source/app/models/settings.rb` — two new settings.
- `source/spec/models/settings_spec.rb` — shared-example coverage for both settings.
