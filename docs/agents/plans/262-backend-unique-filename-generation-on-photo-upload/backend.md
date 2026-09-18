# Backend Plan: Backend — unique filename generation on photo upload

Main plan: [plan.md](plan.md)

## Steps

- [01 — Add Oak::Photo::CreateBuilder](backend/01-add-create-builder.md)
- [02 — Wire the builder into Items::PhotosController](backend/02-wire-controller.md)
- [03 — Update specs](backend/03-update-specs.md)

## CI Checks

- `source`: `cd source && bundle exec rspec` (CI job: `test`)
- repo root: `bundle exec rubocop` (CI job: `checks`)

## Notes

- The exact stem-sanitization ruleset (allowed characters, length limit,
  handling of no-extension/multi-dot filenames) isn't fully specified by
  the issue — majora's own docs don't spell it out either. Step 01 proposes
  a conservative default (alphanumeric/underscore/hyphen only, everything
  else replaced); treat it as a starting point, not a hard requirement, and
  adjust if review surfaces a better convention.
- Out of scope, per the issue: photo deletion (backend endpoints, proxy
  route, frontend UI — separate sub-issues of #261), content-based dedup,
  and any change to `CreateItemPhotosJob`/`ProcessUserItemPhotosJob` (the
  filesystem-scan ingestion path, which must keep setting `file_name` to
  the real on-disk filename untouched by this builder).
