# Kind Pages — Frontend Pages

[← Back to Kind Pages](../kind.md)

Concrete component/controller/helper structure, routing, and test
expectations for #274 to implement against — mirroring `Category`/
`CategoryNew`/`CategoryEdit`, adapted for `Kind`'s single-`name` shape (no
`kinds`-style sub-association to manage, so no `CategoryKindsEditor`
equivalent is needed).

## Pages to add

| Component | Route | Mirrors |
|---|---|---|
| `Kind` (show) | `/#/kinds/:slug` | `Category.jsx` / `CategoryController.js` / `CategoryHelper.jsx` |
| `KindNew` | `/#/kinds/new` | `CategoryNew.jsx` / `CategoryNewController.js` / `CategoryNewHelper.jsx` |
| `KindEdit` | `/#/kinds/:slug/edit` | `CategoryEdit.jsx` / `CategoryEditController.js` (reuses `CategoryNewHelper` for rendering — no separate `CategoryEditHelper.jsx` exists) |

All three live under `frontend/assets/js/components/pages/` (`Kind.jsx`,
`KindNew.jsx`, `KindEdit.jsx`), with controllers under
`pages/controllers/` and helpers under `pages/helpers/`.
`KindsHelper.jsx`'s `CatalogCard` already links each card to
`/#/kinds/${slug}`; adding the `Kind` show page/route below is what makes
that link resolve instead of 404ing at the router level.

## `Kind` (show page)

- `Kind.jsx` — same state shape as `Category.jsx` (`kind`, `logged`,
  `loading`, `error`), same `loading`/`error`/`content` branching.
- `KindController.js` — mirrors `CategoryController.js`:
  - `getKindSlugFromHash(hash)` using `Router.extractParams('/kinds/:slug', hash)`.
  - Fetches `GET /kinds/:slug.json`, normalizes the response (no
    `kinds`-array normalization needed, unlike `Category`'s
    `#normalizeCategory`, since `Kind` has no nested collection).
  - Same `isLoggedIn()`/`subscribe()` wiring for the `logged` state, used
    to gate the Edit button.
- `KindHelper.jsx` — mirrors `CategoryHelper.jsx`:
  - `renderLoading()` / `renderError(error)` — same `LoadingMessage`/
    `ErrorContainer` elements, kind-specific copy (`'Loading kind...'`).
  - `render(kind, logged)` — a `CategoryItemInfoCard` wrapping an
    `OptionalImage` (`snap_url`); **no `CategoryKinds` child** (that
    component lists a category's kinds — a kind has no such sub-list).
  - Actions row: `Back` (→ `/#/kinds`) and, when `logged`, `Edit` (→
    `/#/kinds/:slug/edit`) — no `Items` action (`Category`'s `Items`
    button links to that category's items list; kinds have no equivalent
    index scoped to them).

## `KindNew`

- `KindNew.jsx` — mirrors `CategoryNew.jsx`'s `loading`/`saving`/`error`
  state shape, minus the `kinds` list state (`Category`'s form needs the
  full kinds list for its `CategoryKindsEditor`; `Kind`'s form has no such
  child).
- `KindNewController.js extends KindFormController` (see below) — mirrors
  `CategoryNewController.js`:
  - `buildEffect()` fetches `GET /kinds/new.json` only (no second
    `kinds`-list fetch, unlike `CategoryNewController`'s
    `Promise.all([fetchCategory, fetchKinds])`).
  - `save(kind)` — `POST /kinds.json` with `{ kind: { name } }`, redirect
    to `/#/kinds/:slug` on success (`slug` from the response).
  - `cancelHref()` → `/#/kinds`.
- `KindFormController extends BasePageController` — mirrors
  `CategoryFormController.js`, trimmed to what `Kind` needs:
  `onFieldChange(field, value)`, `normalizeKind(kind)` (just
  `{ ...kind, name: kind.name || '' }`), `buildPayload(kind)` (just
  `{ kind: { name: kind.name || '' } }`), `onSaveError()`,
  `finalizeSave()`, `finalizeLoad(safeSet)`. **No** `onAddKind`/
  `onRemoveKind`/`fetchKinds` equivalents — those exist on
  `CategoryFormController` only because a category owns a `kinds`
  collection.
- `KindNewHelper.jsx` — mirrors `CategoryNewHelper.jsx`, minus the
  `CategoryKindsEditor` block: a `CategoryItemInfoCard` with a single
  `LabeledInput` for `name`, and the same `Back`/`Save` actions row (`Back`
  → `/#/kinds`).

## `KindEdit`

- `KindEdit.jsx` — mirrors `CategoryEdit.jsx`: same state shape as
  `KindNew.jsx`, loads the existing kind via slug from the hash, renders
  with `KindNewHelper` (same "reuse the New helper for Edit" pattern
  `CategoryEdit.jsx` already uses via `CategoryNewHelper`) — no separate
  `KindEditHelper.jsx`.
- `KindEditController.js extends KindFormController` — mirrors
  `CategoryEditController.js`:
  - `getKindEditSlugFromHash(hash)` using `Router.extractParams('/kinds/:slug/edit', hash)`.
  - `buildEffect()` fetches `GET /kinds/:slug.json` only.
  - `save(kind)` — `PATCH /kinds/:slug.json`, redirect to `/#/kinds/:slug`
    on success (falls back to the original slug if the response doesn't
    include one, same as `CategoryEditController`).
  - On save failure (`422`, see [Backend Contracts](backend-contracts.md#validationerror-states)):
    generic `this.setError('Unable to save kind.')` via the inherited
    `onSaveError()` — no attempt to read field-level errors from the
    response body, since the backend doesn't return any.

## Routing wiring

Add to `frontend/assets/js/utils/HashRouteResolver.js`'s
`#buildRouter()`, alongside the existing `router.register('/kinds', 'kinds')`
line — order matters (more specific routes before `/kinds`, following the
existing category-route ordering):

```js
router.register('/kinds/:slug/edit', 'kindEdit');
router.register('/kinds/new', 'kindNew');
router.register('/kinds/:slug', 'kind');
router.register('/kinds', 'kinds');
```

Add to `frontend/assets/js/components/helpers/AppHelper.jsx`'s imports and
`PAGES` map:

```jsx
import Kind from '../pages/Kind.jsx';
import KindEdit from '../pages/KindEdit.jsx';
import KindNew from '../pages/KindNew.jsx';

const PAGES = {
  // ...existing entries...
  kind: <Kind />,
  kindEdit: <KindEdit />,
  kindNew: <KindNew />,
};
```

## Test-coverage expectations

One Jasmine spec file per new component/controller/helper (mirroring the
existing `Category*`/`CategoryNew*`/`CategoryEdit*` spec files), covering
at a high level:

- **`Kind` (show)** — loading state, error state (fetch failure, missing/
  unresolvable slug), successful render (with and without `logged`, to
  verify the Edit button gating).
- **`KindNew`** — loading state, error state (form-data fetch failure),
  field-change updates state, successful save redirects to the new kind's
  slug, save failure (`422` or network) surfaces the generic error
  message without crashing.
- **`KindEdit`** — same shape as `KindNew`, plus: loads existing kind data
  correctly from the slug in the hash, missing/unresolvable slug produces
  the load-error state (mirrors `CategoryEditController`'s
  `#fetchCategory` slug guard).
- **`KindFormController`** — unit coverage for `normalizeKind`/
  `buildPayload`/`onFieldChange` shared behavior, same style as any
  `CategoryFormController` spec coverage.
- **Routing** — `HashRouteResolver` spec coverage for the three new routes
  resolving to the right page identifiers, and `AppHelper` spec coverage
  for the three new `PAGES` entries rendering the right component.

No auth-flow-specific test cases beyond what's listed above — `Kind`
show's Edit-button gating is the only place login state affects
rendering. `KindNew.jsx`/`KindEdit.jsx` don't gate on login client-side
(same as `CategoryNew.jsx`/`CategoryEdit.jsx` today): an unauthenticated
request is rejected server-side by `UserRequired`'s
`redirect_if_unauthorized` (see [Backend Contracts](backend-contracts.md)),
so no new frontend auth-redirect handling or test is needed.
