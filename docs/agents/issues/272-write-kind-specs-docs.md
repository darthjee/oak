# Issue: Write kind specs docs

## Description

Write the up-front design specs for the Kind pages feature (show/new/edit pages, header navigation, and the backend CRUD gap) before any of it is implemented, mirroring the `docs/agents/photo_upload/` precedent written for the photo upload flow.

## Problem

Kinds currently only have a list page (`Kinds.jsx`/`KindsController.js`/`KindsHelper.jsx`, wired at `/#/kinds`) and backend `index`/`new`/`create`/`show` routes on `Oak::Kind`. Parent issue #271 splits the rest of the feature (backend edit/update, frontend show/new/edit pages, header nav link) across three follow-up issues — #273, #274, #275 — but none of them have a concrete design to implement against yet. Without written specs, each of those would have to independently decide component shape, routes, API surface, and validation behavior, risking drift from the existing `Category`/`CategoryNew`/`CategoryEdit` pattern they're meant to mirror.

## Solution

Add `docs/agents/specs/kind.md` as a short landing page, then split it into `docs/agents/specs/kind/*.md` topic docs — mirroring the `docs/agents/photo_upload/` folder shape (an `index.md` linking out to focused topic files). The specs must cover, in enough detail for #273/#274/#275 to implement without further design discussion:

- **Backend** (feeds #273): the missing `edit`/`update` routes and controller wiring for `Oak::Kind`, strong params, and decorator exposure needed for the edit form — including concrete request/response shapes, like `docs/agents/photo_upload/contracts.md` gives for the photo upload endpoints, not just prose.
- **Frontend pages** (feeds #274): the `Kind`/`KindNew`/`KindEdit` page/controller/helper trio, mirroring `Category`/`CategoryNew`/`CategoryEdit` — component structure, routes, `AppHelper.jsx` wiring, and Jasmine test-coverage expectations (stated at a high level — success/validation/auth cases — not enumerated test-by-test).
- **Navigation** (feeds #275): the plain "Kinds" nav link in `Header.jsx`/`HeaderHelper.jsx`, placed right after the "Categories" dropdown, always visible, no submenu.
- **Validation/error states**: the specs must explicitly define behavior for duplicate kind names and invalid/missing slugs on edit (and any other validation cases the backend spec surfaces), so #273/#274 don't have to decide this themselves.
- **Explicitly out of scope**: kind deletion/destroy.

Link `docs/agents/specs/kind.md` from `docs/agents/summary.md`.

## Benefits

Gives #273/#274/#275 a concrete, agreed-upon design — including exact API contracts and validation behavior — to implement against, keeps the new Kind pages consistent with the existing Category page pattern, and avoids each implementer independently re-deciding component/route shape or error handling. Docs-only change — no risk to production code.
