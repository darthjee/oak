# `CreateItemPhotosJob` sets `ready: true` explicitly

`CreateItemPhotosJob` only ever creates a row for a file it has already
confirmed exists on disk (`item.photos.create!(file_name:)`), so there is
no pending state on that path — it must not rely on the `ready` column's
default, especially once Step 01's second migration flips that default to
`false`.

## Files to Change

- `source/app/jobs/create_item_photos_job.rb` — pass `ready: true`
  explicitly in the `item.photos.create!(...)` call inside `#process`.
- `source/spec/jobs/create_item_photos_job_spec.rb` — assert the created
  photo has `ready: true`.
