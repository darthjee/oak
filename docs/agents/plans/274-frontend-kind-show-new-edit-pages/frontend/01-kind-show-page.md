# Kind show page

Add the `Kind` show page, mirroring `Category.jsx`/`CategoryController.js`/`CategoryHelper.jsx`, backed by the existing `GET /kinds/:slug.json` backend action.

`KindController.js` extends `BasePageController` and follows `CategoryController.js` exactly: export `getKindSlugFromHash(hash = '')` using `Router.extractParams('/kinds/:slug', hash).slug || ''`; constructor `(setKind, setLogged, setLoading, setError, client = null)` defaulting `client` to `new GenericClient()`; `buildEffect()` seeds `isLoggedIn()` into `logged` state, subscribes via `subscribe((logged) => safeSet(this.setLogged, logged))` from `../../../utils/authState.js` (returns the unsubscribe as part of cleanup), extracts `slug` via `getKindSlugFromHash(this.client.currentHash())`, and loads data. Fetch is `GET /kinds/${slug}.json` with no `kinds`-array normalization needed (unlike `Category`'s `#normalizeCategory`) since `Kind` has no nested collection. Load-error message: `'Unable to load kind.'`. Reject immediately (no fetch) when `slug` is empty/unresolvable, same as `CategoryController`.

`Kind.jsx` mirrors `Category.jsx`: state `kind`, `logged`, `loading`, `error`; controller built once via `useMemo(() => new KindController(setKind, setLogged, setLoading, setError), [])`; effect via `controller.buildEffect()`; renders `KindHelper.renderLoading()` / `KindHelper.renderError(error)` / `KindHelper.render(kind, logged)`.

`KindHelper.jsx` mirrors `CategoryHelper.jsx`: `renderLoading()` → `<LoadingMessage message='Loading kind...' />`; `renderError(error)` → `<ErrorContainer error={error} />`; `render(kind, logged)` → a `CategoryItemInfoCard` (name={kind.name}) wrapping an `OptionalImage` (`src={kind.snap_url}`); actions row renders a `Back` link (`/#/kinds`) and, only `if (logged)`, an `Edit` link (`/#/kinds/${kind.slug}/edit`) — no `Items` action (no scoped item index for kinds) and no `CategoryKinds`-equivalent child (a kind has no nested kinds list).

## Files to Change

- `frontend/assets/js/components/pages/controllers/KindController.js` (new) — show-page controller, as described above.
- `frontend/assets/js/components/pages/Kind.jsx` (new) — show-page component.
- `frontend/assets/js/components/pages/helpers/KindHelper.jsx` (new) — show-page render helper.
- `frontend/spec/components/pages/controllers/KindController_spec.js` (new) — mirror `CategoryController_spec.js`: `getKindSlugFromHash` unit coverage, `buildEffect()`/load success/failure (missing/unresolvable slug → load-error state), `logged` seed + `subscribe` wiring, `client` defaulting to `new GenericClient()`.
- `frontend/spec/components/pages/Kind_spec.js` (new) — `itRendersPageLoadingState(Kind, 'Loading kind...')` (shared example from `frontend/spec/support/shared_examples/pageExamples.js`).
- `frontend/spec/components/pages/helpers/KindHelper_spec.js` (new) — `itRendersLoadingAndErrorStates(KindHelper, 'Loading kind...')` (shared example from `frontend/spec/support/shared_examples/pageHelperExamples.js`) plus custom assertions on `render(kind, logged)`: Edit link present only when `logged`, Back link always present, no Items link.
