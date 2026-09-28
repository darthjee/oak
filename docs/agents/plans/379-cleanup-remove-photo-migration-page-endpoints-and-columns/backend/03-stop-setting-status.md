# Stop setting migration_status on photo creation

Once the column is gone, stop passing `migration_status: :migrated` when creating photos.

## Files to Change
- `source/app/builders/oak/photo/create_builder.rb` — remove `migration_status: :migrated` from `photo_params`, keeping `file_name` (via `UniqueFileName`) and `ready: false`.
- `source/app/jobs/create_item_photos_job.rb` — change to `item.photos.create!(file_name:, ready: true)`.
- `source/spec/builders/oak/photo/create_builder_spec.rb` — remove the `'marks the photo as migrated'` example.
- `source/spec/jobs/create_item_photos_job_spec.rb` — remove the `'creates photos as migrated'` example.
