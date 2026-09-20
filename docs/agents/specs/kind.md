# Kind Pages

Design specs for the Kind pages feature — backend `edit`/`update`, frontend
`Kind`/`KindNew`/`KindEdit` show/new/edit pages, and a plain "Kinds" header
nav link — written up front so parent issue #271's three follow-ups
(#273 backend, #274 frontend pages, #275 navigation) have a concrete,
agreed-upon design to implement against, mirroring the
[`docs/agents/photo_upload/`](../photo_upload/index.md) precedent.

Kinds currently only have a list page
(`frontend/assets/js/components/pages/Kinds.jsx` /
`controllers/KindsController.js` / `helpers/KindsHelper.jsx`, wired at
`/#/kinds`) and backend `index`/`new`/`create`/`show` routes on
`Oak::Kind` (`source/app/controllers/kinds_controller.rb`). Each card on
the list page already links to `/#/kinds/:slug` (`KindsHelper.jsx`'s
`CatalogCard href`), but that route has no page behind it yet. The specs
below close that gap by mirroring the existing `Category`/`CategoryNew`/
`CategoryEdit` pattern, adapted for `Kind`'s much simpler shape (a single
`name` field, no nested associations to manage).

- [Backend Contracts](kind/backend-contracts.md) — the missing `edit`/
  `update` routes and controller wiring for `Oak::Kind`, strong params,
  decorator exposure, and concrete request/response shapes for the happy
  path and validation failures.
- [Frontend Pages](kind/frontend-pages.md) — the `Kind`/`KindNew`/
  `KindEdit` page/controller/helper trio, routes, `AppHelper.jsx` wiring,
  and Jasmine test-coverage expectations.
- [Navigation](kind/navigation.md) — the plain "Kinds" nav link in
  `Header.jsx`/`HeaderHelper.jsx`.

## Out of scope

- Kind deletion/destroy — explicitly excluded from this feature, both from
  the specs and from #273/#274/#275.
- Implementing any of the flow above — that's #273 (backend), #274
  (frontend pages), and #275 (navigation).
