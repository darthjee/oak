# Frontend Plan: Kinds: add "New kind" entry point and category selection on the kind form

Main plan: [plan.md](plan.md)

## Shared contracts

- Kind form JSON (from `/kinds/new.json`, `/kinds/:slug.json`): `{ name, slug, snap_url, categories: [{ name, slug }] }`. Treat a missing/non-array `categories` as `[]`.
- Save payload: always send `{ kind: { name, categories: [{ slug }] } }` (possibly `categories: []`) on `POST /kinds.json` and `PATCH /kinds/:slug`.
- Available categories: `GET /categories.json?filters[include_empty]=true` → array of `{ name, slug, snap_url }` (first page only, accepted limitation).

## Steps

- [01 — "New kind" entry points](frontend/01-new-kind-entry-points.md)
- [02 — Kind categories editor component](frontend/02-kind-categories-editor.md)
- [03 — Wire categories into the kind new/edit forms](frontend/03-kind-form-categories.md)

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Follow the existing Controller/Helper split and JSDoc conventions; every new/changed controller, helper and component needs Jasmine specs.
- The header Kinds dropdown does **not** list individual kinds (no extra fetch in the header).
