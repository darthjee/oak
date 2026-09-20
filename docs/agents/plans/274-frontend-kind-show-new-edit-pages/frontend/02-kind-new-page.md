# Kind new page

Add the `KindNew` page (new-kind form), plus the shared `KindFormController` base it and the edit page (step 03) both extend, backed by the existing `GET /kinds/new.json` and `POST /kinds.json` backend actions.

`KindFormController.js` extends `BasePageController` and mirrors `CategoryFormController.js` trimmed to `Kind`'s single-`name` shape (no `kinds`-list state, no `onAddKind`/`onRemoveKind`/`fetchKinds` equivalents — those exist on `CategoryFormController` only because a category owns a `kinds` association):
- `onFieldChange(field, value)` → `this.setKind(current => ({ ...current, [field]: value }))`.
- `normalizeKind(kind)` → `{ ...kind, name: kind.name || '' }`.
- `buildPayload(kind)` → `{ kind: { name: kind.name || '' } }` (matches the backend's `kind_params.permit(:name)`).
- `onSaveError()` → `this.setError('Unable to save kind.')`.
- `finalizeSave()` → `this.setSaving(false)`.
- `finalizeLoad(safeSet)` → `safeSet(this.setLoading, false)`.

`KindNewController.js extends KindFormController`, mirroring `CategoryNewController.js`:
- Constructor `(setKind, setLoading, setSaving, setError, client = null, locationTarget = null)` — no `setKinds` param (unlike `CategoryNewController`, since `Kind` needs no kinds-list fetch).
- `buildEffect()` — no login-state tracking (matches `CategoryNewController`); builds `safeSet`, calls private `#loadData(safeSet)` which fetches `GET /kinds/new.json` only (no `Promise.all` with a second list fetch, unlike `CategoryNewController`), normalizes via `this.normalizeKind`, and finalizes via `this.finalizeLoad(safeSet)`.
- `save(kind)` — validates `kind` is truthy (else `setError` + reject); sets `saving=true`, `error=null`; `this.client.post('/kinds.json', this.buildPayload(kind))` → on success, redirect via `this.locationTarget.hash = '#/kinds/${saved?.slug || ''}'`; on failure, `this.onSaveError()`; `finally` calls `this.finalizeSave()`.
- `cancelHref()` → `'/#/kinds'` (defined and unit-tested per the `CategoryNewController` precedent, even though — matching that same existing precedent — the helper below hardcodes the Back href rather than calling this method; see [frontend.md](../frontend.md)'s Notes).

`KindNew.jsx` mirrors `CategoryNew.jsx` minus the kinds-list machinery: state `kind`, `loading`, `saving`, `error`; controller via `useMemo`; renders `KindNewHelper.render(kind, saving, onFieldChange, onSave)` where `onFieldChange`/`onSave` wrap `controller.onFieldChange`/`controller.save(kind)`.

`KindNewHelper.jsx` mirrors `CategoryNewHelper.jsx` minus the `CategoryKindsEditor` block: `renderLoading()` → `'Loading kind new form...'`; `renderError(error)`; `render(kind, saving, onFieldChange, onSave)` → a `CategoryItemInfoCard` (name={kind.name || 'New Kind'}) with a single `LabeledInput` for `name` (`onChange` wired via a field-change handler mirroring `#buildFieldChangeHandler`); actions row: Back link (hardcoded `/#/kinds`) + Save button (`disabled={saving}`, text toggles `'Saving...'`/`'Save'`).

## Files to Change

- `frontend/assets/js/components/pages/controllers/KindFormController.js` (new) — shared form-controller base, as described above.
- `frontend/assets/js/components/pages/controllers/KindNewController.js` (new) — new-kind controller.
- `frontend/assets/js/components/pages/KindNew.jsx` (new) — new-kind page component.
- `frontend/assets/js/components/pages/helpers/KindNewHelper.jsx` (new) — new-kind form render helper (also reused by `KindEdit` in step 03).
- `frontend/spec/components/pages/controllers/KindNewController_spec.js` (new) — mirror `CategoryNewController_spec.js`: `buildEffect()`/load success/failure, `save()` success (redirect to `/#/kinds/:slug`) and failure (`422`/network → generic error, no crash), `cancelHref()`, `client` defaulting to `new GenericClient()`. This spec is also where `KindFormController`'s shared behavior (`normalizeKind`/`buildPayload`/`onFieldChange`) gets indirect coverage, matching the `CategoryFormController` precedent of no standalone spec file.
- `frontend/spec/components/pages/KindNew_spec.js` (new) — `itRendersPageLoadingState(KindNew, 'Loading kind new form...')`.
- `frontend/spec/components/pages/helpers/KindNewHelper_spec.js` (new) — `itRendersLoadingAndErrorStates(KindNewHelper, 'Loading kind new form...')` plus custom assertions: name input reflects `kind.name`, field-change handler fires `onFieldChange('name', ...)`, Save button disabled while `saving`, Save button text toggles.
