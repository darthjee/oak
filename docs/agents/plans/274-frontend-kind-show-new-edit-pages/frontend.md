# Frontend Plan: Frontend: Kind show/new/edit pages

Main plan: [plan.md](plan.md)

## Steps

- [01 — Kind show page](frontend/01-kind-show-page.md)
- [02 — Kind new page](frontend/02-kind-new-page.md)
- [03 — Kind edit page](frontend/03-kind-edit-page.md)
- [04 — Routing and AppHelper wiring](frontend/04-routing-and-apphelper-wiring.md)

## CI Checks

- `frontend`: `docker-compose run --rm oak_fe npm test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm oak_fe npm run lint` (CI job: `frontend-checks`)

## Notes

- `CategoryNewController.cancelHref()` is defined and unit-tested but is **not** actually wired into `CategoryNewHelper` — the helper hardcodes the Back link href (`/#/categories`) directly instead of calling it. Follow the same existing pattern for `KindNewController`/`KindNewHelper` (define `cancelHref()`, hardcode the Back href in the helper) for consistency with the codebase as it stands today; fixing that inconsistency is out of scope for this issue.
- `Kinds.jsx` already tracks `logged` state (`const [, setLogged] = useState(false)`) but doesn't consume the value in render — it looks prepared for a future "New Kind" button mirroring `CategoriesHelper`'s `#renderNewButton(logged)`. Neither the issue nor `docs/agents/specs/kind/frontend-pages.md` asks for this, so it's out of scope here: `/#/kinds/new` is reachable only via direct URL after this issue ships. Flag as a possible follow-up issue, not part of #274.
- `KindNew`/`KindEdit` pages do not gate on `logged` client-side (matching `CategoryNew`/`CategoryEdit`) — unauthenticated requests are rejected server-side by `UserRequired`'s `redirect_if_unauthorized`, so no client-side auth redirect handling is needed.
- Kind deletion/destroy is explicitly out of scope (per the issue and the spec).
