# Add migration state to photos

Add a migration with three columns on `photos`:

- `migration_status` string, `default: 'pending'`, `null: false`;
- `migration_file_name` string, nullable;
- `migration_claimed_at` datetime, nullable.

In the same migration, backfill `migrated` for rows whose `file_name` matches the UUID naming (`/-\h{8}-\h{4}-\h{4}-\h{4}-\h{12}\.[^.]+\z/i`). Do it with a lightweight migration-local model (`Class.new(ActiveRecord::Base) { self.table_name = 'photos' }`) iterating in batches. Alternatively, use a single `UPDATE ... WHERE file_name REGEXP ...` if the MySQL regex works in both dev and CI. Keep it reversible: `down` drops the columns.

In `Oak::Photo`, declare a string-backed enum: `enum :migration_status, { pending: 'pending', migrating: 'migrating', migrated: 'migrated', missing: 'missing' }, prefix: :migration`. The prefix avoids clashing with other predicates and scopes. Add a `MIGRATION_CLAIM_TIMEOUT = 5.minutes` constant.

Update `db/schema.rb` and the photo factory if needed (the default `pending` is fine).

Specs:

- the enum values and the default;
- the backfill logic. Extract the UUID matcher into a small model-level method, e.g. `Oak::Photo.uuid_file_name?`, test it there, and have the migration use the same regex.

## Files to Change

- `source/db/migrate/<timestamp>_add_migration_state_to_photos.rb`: new migration and backfill.
- `source/db/schema.rb`: regenerated.
- `source/app/models/oak/photo.rb`: enum, timeout constant, UUID-pattern helper.
- `source/spec/models/oak/photo_spec.rb`: enum, default and helper coverage.
