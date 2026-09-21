# Frontend Plan: Reduce parameter counts in CategoryItemEdit* components (frontend)

Main plan: [plan.md](plan.md)

## Overview

Codacy (Lizard `parameter-count-medium`, limit 8) flags three methods in the "category item edit"
area:

- `CategoryItemEditController` constructor — 12 parameters
- `CategoryItemEditHelper.render` — 17 parameters
- `CategoryItemEditHelper.#renderPhotoSection` — 9 parameters

Group the parameters into option/props objects, agreed during issue discussion:

- Controller constructor: **three** objects — core state setters, photo-upload state setters, and
  injectable collaborators (`client`/`locationTarget`/`uploadClient`).
- `render`: the 8 photo-related parameters collapse into a **single `photo` props object**, passed
  straight through to `#renderPhotoSection`. Grouping only the photo params still leaves 9 flat
  parameters (`item`, `kinds`, `saving`, the link-editing callbacks, `onSave`, `cancelHref`) plus
  `photo` — 10 total, still above the limit of 8. So those 9 are grouped too: `kinds`, `saving`,
  the callbacks, and `cancelHref` go into a second object, `formState`, while `item` stays a
  top-level parameter (it's the primary domain object, also needed by `#renderPhotoSection`). This
  keeps `render` at 3 parameters (`item`, `formState`, `photo`) and `#renderPhotoSection` at 2
  (`item`, `photo`).

`CategoryItemEditHelper.render` is shared by two callers: `CategoryItemEdit.jsx` (passes all
photo-related fields) and `CategoryItemNew.jsx` (passes only `formState`, relying on `photo`
defaulting to `{}`). `#renderPhotoSection` already early-returns `null` when `!item.id`, which is
always true for `CategoryItemNew`'s not-yet-created item, so this preserves today's behavior
exactly.

## Implementation Steps

### Step 1 — Group `CategoryItemEditController` constructor parameters

Change the constructor from 12 positional parameters to 3 grouped parameters:

```js
constructor(setters, photoSetters = {}, dependencies = {}) {
  super();

  const { setItem, setKinds, setLoading, setSaving, setError } = setters;
  const {
    setUploading = null,
    setUploadError = null,
    setDeletingPhotoId = null,
    setDeleteErrorByPhotoId = null,
  } = photoSetters;
  const { client = null, locationTarget = null, uploadClient = null } = dependencies;

  this.setItem = setItem;
  this.setKinds = setKinds;
  this.setLoading = setLoading;
  this.setSaving = setSaving;
  this.setError = setError;
  this.client = client ?? new GenericClient();
  this.locationTarget = locationTarget ?? CategoryItemEditController.#defaultLocationTarget();
  this.setUploading = setUploading;
  this.setUploadError = setUploadError;
  this.uploadClient = CategoryItemEditController.#resolveUploadClient(uploadClient);
  this.setDeletingPhotoId = setDeletingPhotoId;
  this.setDeleteErrorByPhotoId = setDeleteErrorByPhotoId;
}
```

Update the class-level JSDoc to document the three grouped parameters (`setters`, `photoSetters`,
`dependencies`) instead of the 12 flat ones — keep the per-field descriptions, just nested under
their new object.

Update the only call site, `CategoryItemEdit.jsx`:

```js
const controller = useMemo(
  () => new CategoryItemEditController(
    { setItem, setKinds, setLoading, setSaving, setError },
    { setUploading, setUploadError, setDeletingPhotoId, setDeleteErrorByPhotoId }
  ),
  []
);
```

(No `dependencies` object needed here — production code always wants the real
`GenericClient`/`window.location`/`PhotoUploadClient` defaults.)

Update `CategoryItemEditController_spec.js`'s `buildController` helper to construct the three
grouped objects instead of passing 12 positional arguments — the individual `setters.setX` spies
and `overrides.client`/`overrides.locationTarget`/`overrides.uploadClient` stay the same, only how
they're packaged into the `new CategoryItemEditController(...)` call changes. No test assertion
changes are needed beyond this — the constructor's externally observable behavior (which setter
gets called with what, which client is used) is unchanged.

### Step 2 — Group `CategoryItemEditHelper.render`/`#renderPhotoSection` parameters

Change `render` from 17 positional parameters to 3 grouped parameters (`item`, `formState`,
`photo`):

```js
static render(item, formState, photo = {}) {
  const {
    kinds,
    saving,
    onFieldChange,
    onLinkChange,
    onRemoveLink,
    onAddLink,
    onSave,
    cancelHref = null,
  } = formState;

  return (
    <div className='container mt-4'>
      {this.#renderActions(item, saving, onSave, cancelHref)}
      {this.#renderInfoCard(item, kinds, onFieldChange)}

      <CategoryItemLinksEditor
        links={this.#normalizeLinks(item.links)}
        onAddLink={onAddLink}
        onLinkChange={onLinkChange}
        onRemoveLink={onRemoveLink}
      />

      {this.#renderPhotoSection(item, photo)}
    </div>
  );
}
```

and `#renderPhotoSection` from 9 positional parameters to 2:

```js
static #renderPhotoSection(item, photo = {}) {
  const {
    uploading = false,
    uploadError = null,
    selectedFile = null,
    onSelectFile = null,
    onUploadPhoto = null,
    deletingPhotoId = null,
    deleteErrorByPhotoId = null,
    onDeletePhoto = null,
  } = photo;

  if (!item.id) {
    return null;
  }

  // ...unchanged body below, using the destructured names above
}
```

Update the class-level JSDoc to document `item`, `formState` (with its nested fields), and `photo`
(with its nested fields) instead of the 17 flat parameters.

Update both call sites:

`CategoryItemEdit.jsx`:

```js
return CategoryItemEditHelper.render(
  item,
  {
    kinds,
    saving,
    onFieldChange,
    onLinkChange,
    onRemoveLink,
    onAddLink,
    onSave,
  },
  {
    uploading,
    uploadError,
    selectedFile,
    onSelectFile,
    onUploadPhoto,
    deletingPhotoId,
    deleteErrorByPhotoId,
    onDeletePhoto,
  }
);
```

`CategoryItemNew.jsx` (no `photo` argument — defaults to `{}`, matching today's behavior where it
never passed photo-related params):

```js
return CategoryItemEditHelper.render(item, {
  kinds,
  saving,
  onFieldChange: (field, value) => controller.onFieldChange(field, value),
  onLinkChange: (index, field, value) => controller.onLinkChange(index, field, value),
  onRemoveLink: (index) => controller.onRemoveLink(index),
  onAddLink: () => controller.onAddLink(),
  onSave: () => controller.save(item),
  cancelHref: controller.cancelHref(item),
});
```

Update the three specs that call `CategoryItemEditHelper.render(...)` directly to pass the new
`(item, formState, photo)` shape instead of positional arguments:

- `frontend/spec/components/pages/helpers/CategoryItemEditHelper_spec.js`
- `frontend/spec/components/pages/CategoryItemEdit_spec.js`
- `frontend/spec/components/pages/CategoryItemNew_spec.js`

No assertion changes are needed beyond the call shape — the rendered output and forwarded props
(e.g. `PhotosCarousel`'s `deletingPhotoId`/`deleteErrorByPhotoId`/`onDeletePhoto`) are unchanged.

## Files to Change

- `frontend/assets/js/components/pages/controllers/CategoryItemEditController.js` — group
  constructor parameters into `setters`/`photoSetters`/`dependencies` objects; update JSDoc.
- `frontend/assets/js/components/pages/helpers/CategoryItemEditHelper.jsx` — group `render` and
  `#renderPhotoSection` parameters into `item`/`formState`/`photo`; update JSDoc.
- `frontend/assets/js/components/pages/CategoryItemEdit.jsx` — update both call sites (controller
  construction and `render` call).
- `frontend/assets/js/components/pages/CategoryItemNew.jsx` — update the `render` call site.
- `frontend/spec/components/pages/controllers/CategoryItemEditController_spec.js` — update
  `buildController` to construct the grouped objects.
- `frontend/spec/components/pages/helpers/CategoryItemEditHelper_spec.js` — update direct `render`
  calls to the new grouped shape.
- `frontend/spec/components/pages/CategoryItemEdit_spec.js` — update direct `render` calls to the
  new grouped shape.
- `frontend/spec/components/pages/CategoryItemNew_spec.js` — update the direct `render` call to the
  new grouped shape.

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes

- `CategoryItemNewController` and `CategoryItemNewController_spec.js` are unaffected — that
  controller already takes 5 flat parameters, under the limit, and is untouched by this issue.
  `CategoryItemNew.jsx` only needs its `CategoryItemEditHelper.render(...)` call updated.
- Keep default values (`photo = {}`, individual defaults inside the destructure) so omitting
  `photo` entirely — as `CategoryItemNew.jsx` does — continues to behave exactly as today's
  individually-defaulted positional parameters did.
