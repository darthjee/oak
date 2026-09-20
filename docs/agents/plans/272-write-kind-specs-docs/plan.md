# Plan: Write kind specs docs

Issue: [272-write-kind-specs-docs.md](../../issues/272-write-kind-specs-docs.md)

## Overview

Write the up-front design specs for the Kind pages feature (backend edit/update, frontend show/new/edit pages, header nav link) before any of #273/#274/#275 implement it — mirroring the `docs/agents/photo_upload/` precedent. Docs-only change: a short `docs/agents/specs/kind.md` landing page plus focused topic files under `docs/agents/specs/kind/`.

## Context

Kinds currently only have a list page (`frontend/assets/js/components/pages/Kinds.jsx` / `controllers/KindsController.js` / `helpers/KindsHelper.jsx`, wired at `/#/kinds` via `AppHelper.jsx`) and backend `index`/`new`/`create`/`show` routes on `Oak::Kind` (`source/app/controllers/kinds_controller.rb`, `resources :kinds, only: %i[index new create show], param: :slug` in `source/config/routes.rb`). Categories already have the full pattern this issue must specify for kinds: `Category`/`CategoryNew`/`CategoryEdit` page/controller/helper trios, and a `Header.jsx`/`HeaderHelper.jsx` dropdown. The specs must give #273 (backend), #274 (frontend pages), and #275 (nav link) a concrete design — including exact API contracts and validation/error behavior — to implement against without further design discussion.

## Implementation Steps

### Step 1 — Write `docs/agents/specs/kind.md` and `docs/agents/specs/kind/*.md`

Read the existing Category pattern before writing, so the specs describe the real shapes rather than inventing new ones:
- `source/app/controllers/categories_controller.rb`, `source/app/controllers/category/kinds_controller.rb`, `source/app/decorators/oak/kind/decorator.rb` (or equivalent), and `source/app/models/oak/kind.rb` for backend conventions (`resource_for`, strong params, decorator field lists, validations `Oak::Kind` already has — these become the "duplicate name" / validation-error cases the spec must document).
- `frontend/assets/js/components/pages/Category.jsx`, `CategoryNew.jsx`, `CategoryEdit.jsx` and their `controllers/`/`helpers/` counterparts for the frontend page/controller/helper structure, plus `AppHelper.jsx` for route wiring.
- `frontend/assets/js/components/elements/Header.jsx` / `helpers/HeaderHelper.jsx` for the nav pattern.
- `docs/agents/photo_upload/` (`index.md` + topic files) as the structural precedent for splitting a landing page into focused topic docs.

Write `docs/agents/specs/kind.md` as a short landing page (mirrors `docs/agents/photo_upload/index.md`'s role): what the feature is, why it's being specified up front, links to each topic file below, and an "Out of scope" note for kind deletion/destroy.

Write the topic files under `docs/agents/specs/kind/`:
- `backend-contracts.md` — the missing `edit`/`update` routes for `Oak::Kind` (method, path, `param: :slug`), `KindsController` wiring (`resource_for` options), the strong-params list, the decorator fields exposed to the edit form, and concrete request/response JSON examples for both the happy path and validation failures (duplicate `name`, invalid/missing `slug`) — same level of concreteness as `docs/agents/photo_upload/contracts.md`.
- `frontend-pages.md` — the `Kind` (show), `KindNew`, `KindEdit` page/controller/helper trio: component responsibilities, the routes each maps to (`/#/kinds/:slug`, `/#/kinds/new`, `/#/kinds/:slug/edit`), the `AppHelper.jsx` `PAGES` entries and hash-route wiring needed, and Jasmine test-coverage expectations stated at a high level (success/validation/auth cases, not enumerated test-by-test) — mirroring `Category`/`CategoryNew`/`CategoryEdit`.
- `navigation.md` — the plain "Kinds" nav link: where it renders in `HeaderHelper.jsx`'s `#renderShell` (immediately after the "Categories" dropdown), that it's always visible (no login gating, no submenu), and that no `HeaderController.js` data-fetching changes are needed.

## Files to Change

- `docs/agents/specs/kind.md` — new landing page.
- `docs/agents/specs/kind/backend-contracts.md` — new.
- `docs/agents/specs/kind/frontend-pages.md` — new.
- `docs/agents/specs/kind/navigation.md` — new.

### Step 2 — Link the new specs from `docs/agents/summary.md`

Add rows to the documentation index table (`docs/agents/summary.md`), following the same pattern used for the `Photo Upload` rows: one row for `kind.md` and one per topic file under `docs/agents/specs/kind/`.

## Files to Change

- `docs/agents/summary.md` — add index rows for the new specs.

## Notes

- This plan produces documentation only — no production code changes, no CI-relevant files touched, so no `## CI Checks` section applies.
- Kind deletion/destroy is explicitly out of scope for the specs (per issue #272 and parent #271).
