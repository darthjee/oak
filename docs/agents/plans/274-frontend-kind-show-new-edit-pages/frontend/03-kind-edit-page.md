# Kind edit page

Add the `KindEdit` page (edit-kind form), backed by the `GET /kinds/:slug/edit.json` and `PATCH /kinds/:slug.json` backend routes added in #273 (already merged).

`KindEditController.js extends KindFormController` (from step 02), mirroring `CategoryEditController.js`:
- Export `getKindEditSlugFromHash(hash = '')` using `Router.extractParams('/kinds/:slug/edit', hash).slug || ''`.
- Constructor mirrors `KindNewController`'s (`setKind, setLoading, setSaving, setError, client = null, locationTarget = null`).
- `buildEffect()` extracts `slug` via `getKindEditSlugFromHash(this.client.currentHash())`, calls `#loadData(safeSet, slug)`.
- `#fetchKind(slug)` — rejects with the generic load error if `slug` is empty/unresolvable (mirrors `CategoryEditController`'s slug guard, producing the load-error state — this is the same "missing/unresolvable slug" test case as `CategoryEditController_spec.js`); otherwise `GET /kinds/${slug}/edit.json`, normalized via `this.normalizeKind`.
- `save(kind)` — re-extracts `slug` from the hash (not stored from load, matching `CategoryEditController`); validates `slug` + `kind`; `this.client.patch('/kinds/${slug}', this.buildPayload(kind))` → on success, redirect to `'#/kinds/${saved?.slug || slug}'` (falls back to the original slug if the response omits one — the slug is regenerated server-side from the new name, per `docs/agents/specs/kind/backend-contracts.md`); on failure, `this.onSaveError()` (inherited from `KindFormController`, generic `'Unable to save kind.'` message) — **no field-level error parsing**, since the backend's `422` response carries no `errors` key (same decorated-but-invalid shape as the happy path).

`KindEdit.jsx` mirrors `CategoryEdit.jsx`: same state shape as `KindNew.jsx` (`kind`, `loading`, `saving`, `error`); loads the existing kind via the slug parsed from the hash; renders with `KindNewHelper` (reuse, same "reuse the New helper for Edit" pattern `CategoryEdit.jsx` already uses via `CategoryNewHelper`) — **no separate `KindEditHelper.jsx`**.

## Files to Change

- `frontend/assets/js/components/pages/controllers/KindEditController.js` (new) — edit-kind controller, as described above.
- `frontend/assets/js/components/pages/KindEdit.jsx` (new) — edit-kind page component, renders via `KindNewHelper` from step 02.
- `frontend/spec/components/pages/controllers/KindEditController_spec.js` (new) — mirror `CategoryEditController_spec.js`: `getKindEditSlugFromHash` unit coverage, `buildEffect()` load success/failure (missing/unresolvable slug → load-error state), `save()` success (redirect to `/#/kinds/:slug`, with and without a `slug` in the response) and failure (`422` → generic error message, no field-level parsing; network failure → generic error, no crash), `client` defaulting to `new GenericClient()`.
- `frontend/spec/components/pages/KindEdit_spec.js` (new) — `itRendersPageLoadingState(KindEdit, 'Loading kind new form...')` (reuses `KindNewHelper`'s loading copy, same as `CategoryEdit_spec.js` reusing `CategoryNewHelper`'s).
