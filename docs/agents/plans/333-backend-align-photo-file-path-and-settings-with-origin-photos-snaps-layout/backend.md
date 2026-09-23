# Backend Plan: Align photo settings, jobs and dev config with origin/photos/snaps layout

Main plan: [plan.md](plan.md)

## Shared contracts

- `Settings.photos_path` is the storage root. The jobs read originals from `<photos_path>/origin/users/<uid>/items/<id>/`.
- `file_path` in the controller responses stays `users/<uid>/items/<id>/<file>`, and the proxy prefixes it with `origin/`.

## Implementation Steps

### Step 1 — Scan origin/ in the import jobs
- `CreateItemPhotosJob#folder_path`: `File.join(Settings.photos_path, "origin/users/#{user_id}/items/#{item_id}")`.
- `ProcessUserItemPhotosJob#items_folder_path`: `File.join(Settings.photos_path, "origin/users/#{user_id}/items")`.
- In both specs, add `origin/` to `folder_path` / `items_folder_path`, including the `non_existent_items` context. Add one example per job showing that files placed directly under `<photos_path>/users/...` (no `origin/`) are ignored.

### Step 2 — Confirm file_path is unchanged
Don't change `Items::PhotosController#file_path` or `Oak::Photo::FileUrl`. `spec/controllers/items/photos_controller_spec.rb` already pins `file_path` to `users/<uid>/items/<id>/<file>` for the uploading gate (line ~113) and `deletable` (line ~175). Keep those expectations.

## Files to Change
- `source/app/jobs/create_item_photos_job.rb`: scan `origin/`.
- `source/app/jobs/process_user_item_photos_job.rb`: scan `origin/`.
- `source/spec/jobs/create_item_photos_job_spec.rb`: use the new paths, and add an example that the old path is ignored.
- `source/spec/jobs/process_user_item_photos_job_spec.rb`: use the new paths, and add an example that the old path is ignored.

## CI Checks
- `source`: `docker-compose run --rm oak_tests bundle exec rspec spec/jobs spec/controllers/items/photos_controller_spec.rb` (CI job: `test`)
- `source`: `rubocop` (CI job: `checks`)

## Notes
- The jobs only work where the backend can see the photo disk. That covers dev, but not prod: prod runs on Render and has no access to the proxy disk. So this change targets dev.
