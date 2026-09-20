# Issue: Frontend: Kind show/new/edit pages

## Description
Part of #271. Kinds currently only have a list page (`Kinds.jsx` / `KindsController.js` / `KindsHelper.jsx`, wired at `/#/kinds`). Unlike `Category`, which has the full `Category`/`CategoryNew`/`CategoryEdit` page/controller/helper set, `Kind` has no show, new, or edit page.

This issue implements the three missing pages by following the detailed spec written for #271 in `docs/agents/specs/kind/frontend-pages.md` (routing wiring, test-coverage expectations) and `docs/agents/specs/kind/backend-contracts.md` (request/response shapes, error states). The backend `edit`/`update` routes this depends on were already added in #273 (closed and merged — `resources :kinds, only: %i[index new create show edit update]` and the `resource_for Oak::Kind` wiring already include `edit`/`update`), so there is no backend blocker.

## Acceptance Criteria
- [ ] `Kind` (show), `KindNew`, `KindEdit` pages render correctly for loading/error/success states, mirroring the `Category`/`CategoryNew`/`CategoryEdit` pattern.
- [ ] Routes `/#/kinds/:slug`, `/#/kinds/new`, `/#/kinds/:slug/edit` are registered in `HashRouteResolver.js`'s `#buildRouter()` (more specific routes ordered before the existing `/kinds` route) and wired into `AppHelper.jsx`'s `PAGES` map.
- [ ] `KindsHelper.jsx`'s existing `CatalogCard` links to `/#/kinds/${slug}` resolve correctly once the show route exists.
- [ ] `Kind` show's Edit button is gated on `logged`; no `Items` action (kinds have no scoped item index).
- [ ] `KindNew`/`KindEdit` save flows redirect to `/#/kinds/:slug` on success and surface a single generic error message on `422`/network failure (no field-level error parsing, matching the backend's response shape).
- [ ] Jasmine tests added for each new page/controller/helper, plus `KindFormController` unit coverage and `HashRouteResolver`/`AppHelper` route coverage, per `docs/agents/specs/kind/frontend-pages.md`'s test-coverage expectations.
- [ ] ESLint passes with no new offences.

Kind deletion/destroy is explicitly out of scope.

## Solution
Add, mirroring the existing `Category`/`CategoryNew`/`CategoryEdit` trio (`frontend/assets/js/components/pages/Category.jsx`, `CategoryNew.jsx`, `CategoryEdit.jsx` and their `controllers/`/`helpers/` counterparts), all under `frontend/assets/js/components/pages/`:

- **`Kind.jsx` + `KindController.js` + `KindHelper.jsx`** — show page for a single kind (`GET /kinds/:slug.json`, already backed by the existing backend `show` action). Same `kind`/`logged`/`loading`/`error` state shape as `Category.jsx`; no `kinds`-array normalization (unlike `Category`'s `#normalizeCategory`) since `Kind` has no nested collection; no `CategoryKinds`-equivalent child.
- **`KindNew.jsx` + `KindNewController.js` + `KindNewHelper.jsx`** — new-kind form (`GET /kinds/new.json`, `POST /kinds.json`, already backed by the existing backend `new`/`create` actions). No `kinds`-list state/fetch, no `CategoryKindsEditor`-equivalent block.
- **`KindEdit.jsx` + `KindEditController.js`** — edit-kind form (`GET /kinds/:slug/edit.json`, `PATCH /kinds/:slug.json`, backed by the routes added in #273). Reuses `KindNewHelper` for rendering, same as `CategoryEdit.jsx` reuses `CategoryNewHelper` — no separate `KindEditHelper.jsx`.
- **`KindFormController extends BasePageController`** — shared `onFieldChange`/`normalizeKind`/`buildPayload`/`onSaveError`/`finalizeSave`/`finalizeLoad` behavior for `KindNewController`/`KindEditController` to extend, mirroring `CategoryFormController.js` trimmed to `Kind`'s single-`name` shape (no `onAddKind`/`onRemoveKind`/`fetchKinds` equivalents).
- **Routing** — register `/kinds/:slug/edit`, `/kinds/new`, `/kinds/:slug` in `HashRouteResolver.js` (before the existing `/kinds` registration) and wire `kind`/`kindEdit`/`kindNew` into `AppHelper.jsx`'s `PAGES` map, per the exact snippets in `docs/agents/specs/kind/frontend-pages.md`.

Full field-by-field mirroring detail, request/response shapes, and error-handling specifics are in `docs/agents/specs/kind/frontend-pages.md` and `docs/agents/specs/kind/backend-contracts.md`.

## Benefits
Completes the `Kind` page set to parity with `Category`, letting users view, create, and edit kinds from the UI and making the existing `KindsHelper.jsx` catalog-card links to `/#/kinds/${slug}` actually resolve instead of 404ing at the router level.
