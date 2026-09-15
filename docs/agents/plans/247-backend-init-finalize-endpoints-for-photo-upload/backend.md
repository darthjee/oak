# Backend Plan: Backend — Init/Finalize endpoints for photo upload

Main plan: [plan.md](plan.md)

## Steps

- [01 — `ready` column, two-step migration](backend/01-ready-column-migration.md)
- [02 — `CreateItemPhotosJob` sets `ready: true` explicitly](backend/02-create-item-photos-job-explicit-ready.md)
- [03 — Routes + `Items::PhotosController` (Init / status-gate / Finalize)](backend/03-init-finalize-routes-and-controller.md)
- [04 — `ready` filtering on every display path](backend/04-ready-filtering-on-display-paths.md)

## CI Checks

- `source`: `cd source && bundle exec rspec` (CI job: `test`)
- `source`: `cd source && bundle exec rubocop` (CI job: `checks`)

## Notes

- Depends on #245 (docs sub-issue, merged) — the contract below is settled,
  not still under discussion.
- Unblocks #246 (proxy Submit handler) and #248 (frontend upload client),
  which build against the routes/payloads/status codes fixed here.
- Per the issue discussion, both migration steps (add `ready` with
  `default: true`, then flip the default to `false`) land in this same
  PR — do not split the default flip into a follow-up issue.
- `Oak::Photo::Decorator` currently exposes `photo_url`/`snap_url`
  unconditionally; Init's response (`{ id, file_name, ready: false }`)
  must not use it as-is, since the file doesn't exist on disk yet and
  those URLs would 404. Step 03 covers the response-shape decision (a
  dedicated decorator vs. a conditional).
