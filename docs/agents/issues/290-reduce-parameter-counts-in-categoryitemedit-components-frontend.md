# Issue: Reduce parameter counts in CategoryItemEdit* components (frontend)

## Description
Codacy (Lizard `parameter-count-medium`, category Complexity, limit 8) flags three methods in the frontend
"category item edit" area with too many parameters:

- `frontend/assets/js/components/pages/controllers/CategoryItemEditController.js:42` — constructor has 12 parameters
- `frontend/assets/js/components/pages/helpers/CategoryItemEditHelper.jsx:60` — `render` has 17 parameters
- `frontend/assets/js/components/pages/helpers/CategoryItemEditHelper.jsx:141` — `#renderPhotoSection` has 9 parameters

`CategoryItemEditHelper.render` is shared between two callers — `CategoryItemEdit.jsx` (full edit form, passes
all params including photo-related ones) and `CategoryItemNew.jsx` (creation form, omits photo-related params
and relies on their defaults) — so any signature change must keep working for both.

## Problem
Long positional parameter lists are hard to call correctly (easy to swap two adjacent same-typed arguments,
e.g. two setters or two callbacks, without any error) and hard to test, since every call site must supply
arguments in the exact declared order even when only a couple of them are relevant to a given test case.

## Expected Behavior
The constructor, `render`, and `#renderPhotoSection` each accept a small number of parameters — related
values grouped into option/props objects — while preserving current runtime behavior for both
`CategoryItemEdit.jsx` and `CategoryItemNew.jsx`, including `CategoryItemNew`'s reliance on default values
for the photo-related params it doesn't pass.

## Solution
Group related parameters into objects, for example:

- `CategoryItemEditController` constructor: bundle the five state setters (`setItem`, `setKinds`,
  `setLoading`, `setSaving`, `setError`) into one object, the photo-upload state setters
  (`setUploading`, `setUploadError`, `setDeletingPhotoId`, `setDeleteErrorByPhotoId`) into another, and the
  injectable collaborators (`client`, `locationTarget`, `uploadClient`) into a third options object.
- `CategoryItemEditHelper.render`: group the photo-section params (`uploading`, `uploadError`,
  `selectedFile`, `onSelectFile`, `onUploadPhoto`, `deletingPhotoId`, `deleteErrorByPhotoId`,
  `onDeletePhoto`) into a single `photo` props object, and pass it straight through to
  `#renderPhotoSection` (bringing that method's count down too).
- Keep `item`, `kinds`, `saving`, the link-editing callbacks, `onSave`, and `cancelHref` as-is, since they
  are used by both callers and already read clearly.

Update both call sites (`CategoryItemEdit.jsx`, `CategoryItemNew.jsx`) and the existing Jasmine tests for the
controller and helper to match the new signatures.

## Benefits
- Fewer, more structured parameters make both call sites easier to read and harder to call incorrectly.
- Tests can construct only the option objects relevant to a given scenario.
- Brings all three methods under Codacy's parameter-count-medium limit (8).
