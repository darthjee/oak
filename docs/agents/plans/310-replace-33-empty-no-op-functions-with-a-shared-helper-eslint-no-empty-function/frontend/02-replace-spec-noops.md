# Replace inline no-ops in spec files

Replace every inline `() => {}` mock prop/callback (e.g. `onChange: () =>
{}`, `onRemove: () => {}`) in the files below with `noop`, importing it from
`../support/noop.js` (adjust the relative path per file's depth). Where a
spec file already imports other helpers from `spec/support` (e.g.
`factories.js`), add `noop` to the same import statement rather than a
separate one.

Do not change any other behavior — this is a like-for-like replacement of
the callback value passed to each mock.

## Files to Change

- `frontend/spec/components/elements/CategoryKindBadge_spec.js` — replace `onRemove: () => {}` (2 occurrences).
- `frontend/spec/components/pages/CategoryItemEdit_spec.js` — replace 1 occurrence.
- `frontend/spec/components/pages/helpers/CategoryItemEditHelper_spec.js` — replace `onFieldChange`, `onLinkChange`, `onRemoveLink`, `onAddLink`, `onSave` no-ops (7 occurrences).
- `frontend/spec/components/elements/CategoryItemLinksEditor_spec.js` — replace 3 occurrences.
- `frontend/spec/components/pages/helpers/KindNewHelper_spec.js` — replace 4 occurrences.
- `frontend/spec/components/elements/helpers/CategoryKindsEditorListHelper_spec.js` — replace 2 occurrences.
- `frontend/spec/components/pages/CategoryItem_spec.js` — replace 1 occurrence.
- `frontend/spec/components/elements/CollectionSelect_spec.js` — replace 1 occurrence.
- `frontend/spec/components/pages/helpers/CategoryNewHelper_spec.js` — replace 2 occurrences.
- `frontend/spec/components/elements/CategoryKindSelectInput_spec.js` — replace 2 occurrences.
- `frontend/spec/components/pages/CategoryItemNew_spec.js` — replace 1 occurrence.
- `frontend/spec/components/elements/controllers/HeaderController_spec.js` — replace 2 occurrences.
- `frontend/spec/components/elements/CategoryKindsEditorList_spec.js` — replace 2 occurrences.
- `frontend/spec/components/elements/PhotoCarouselItem_spec.js` — replace 1 occurrence.
- `frontend/spec/components/elements/CategoryKindsEditorSelect_spec.js` — replace 2 occurrences.
