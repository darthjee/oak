# Extract UUID naming

Move `unique_file_name`, `sanitized_stem` and `extension` out of `Oak::Photo::CreateBuilder` into a reusable class, e.g. `Oak::Photo::UniqueFileName.build(file_name)` (under `app/models/oak/photo/`, next to `file_url.rb`), returning `<sanitized_stem>-<uuid><ext>`. `CreateBuilder` delegates to it, and the prepare endpoint uses it to build `migration_file_name` from the legacy `file_name`.

Set `migration_status: 'migrated'` on photos built by `CreateBuilder` (`photo_params`) and created by `CreateItemPhotosJob` (`item.photos.create!(file_name:, ready: true, migration_status: 'migrated')`).

Specs:

- new unit spec for the naming class (stem sanitizing, empty-stem fallback to `photo`, extension kept, UUID present);
- existing `create_builder_spec.rb` still passes and asserts `migration_migrated?`;
- `create_item_photos_job_spec.rb` asserts created photos are `migrated`.

## Files to Change

- `source/app/models/oak/photo/unique_file_name.rb`: new naming class.
- `source/app/builders/oak/photo/create_builder.rb`: delegate naming, set `migrated`.
- `source/app/jobs/create_item_photos_job.rb`: set `migrated`.
- `source/spec/models/oak/photo/unique_file_name_spec.rb`: new.
- `source/spec/builders/oak/photo/create_builder_spec.rb`: assert status.
- `source/spec/jobs/create_item_photos_job_spec.rb`: assert status.
