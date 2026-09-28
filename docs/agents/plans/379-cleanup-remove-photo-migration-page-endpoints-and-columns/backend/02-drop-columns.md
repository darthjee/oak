# Drop migration columns and model state

Add a new migration (e.g. `20260928120000_remove_migration_state_from_photos.rb`) that drops `migration_claimed_at`, `migration_file_name` and `migration_status` from `photos` using `change_table :photos, bulk: true`. Give it an explicit `up`/`down`: `down` re-adds the three columns with their original types, and `migration_status` gets `default: 'migrated', null: false`, since every photo is migrated by then. Regenerate `schema.rb`.

In `Oak::Photo`, remove the `migration_status` enum, `MIGRATION_CLAIM_TIMEOUT`, `UUID_FILE_NAME_REGEX` and `self.uuid_file_name?`. Only the migration flow used them.

## Files to Change
- `source/db/migrate/20260928120000_remove_migration_state_from_photos.rb` — new migration.
- `source/db/schema.rb` — the three columns disappear and the version is bumped.
- `source/app/models/oak/photo.rb` — remove the enum, the constants and `uuid_file_name?`.
- `source/spec/models/oak/photo_spec.rb` — remove the `migration_status`, `MIGRATION_CLAIM_TIMEOUT` and `.uuid_file_name?` describe blocks.
