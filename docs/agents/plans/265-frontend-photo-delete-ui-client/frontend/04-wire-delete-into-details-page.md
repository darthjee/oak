# Wire delete into the details page

Repeat step 03's wiring for the read-only details page, which only shows the
delete action while `logged` is true. Add a `PhotoUploadClient` instance and
a `deletePhoto(item, photoId)` method to `CategoryItemController` (same
shape as `CategoryItemEditController#deletePhoto`: set `deletingPhotoId`,
call `uploadClient.delete`, refetch via `#fetchItem` and `setItem` on
success, set a per-photo `deleteErrorByPhotoId` entry on failure, clear
`deletingPhotoId` in `.finally()`). `CategoryItemController` does not
currently take a `PhotoUploadClient`; add it as an optional constructor
param defaulting to `new PhotoUploadClient()`, same convention as
`CategoryItemEditController`'s `uploadClient` param.

`CategoryItemHelper.render(item, logged)` only passes `onDeletePhoto`/
`deletingPhotoId`/`deleteErrorByPhotoId` into `#renderPhotosCarousel` when
`logged` is true, so the delete button never renders for logged-out
visitors — `PhotoCarouselItem` already omits the button whenever
`onDelete` is absent (step 02), so no additional gating is needed there.

## Files to Change

- `frontend/assets/js/components/pages/controllers/CategoryItemController.js`
  — add the `uploadClient` param, `setDeletingPhotoId`/
  `setDeleteErrorByPhotoId` setters, and `deletePhoto(item, photoId)`.
- `frontend/assets/js/components/pages/helpers/CategoryItemHelper.jsx` —
  accept `onDeletePhoto`/`deletingPhotoId`/`deleteErrorByPhotoId`, and pass
  them into `#renderPhotosCarousel`/`PhotosCarousel` only when `logged`.
- `frontend/assets/js/components/pages/CategoryItem.jsx` — add
  `deletingPhotoId`/`deleteErrorByPhotoId` state, pass the new setters into
  `CategoryItemController`, add an `onDeletePhoto` callback, and pass all
  three through to `CategoryItemHelper.render` (only meaningful when
  `logged`, but harmless to always pass — the helper does the gating).
- `frontend/spec/components/pages/controllers/CategoryItemController_spec.js`
  — cover `deletePhoto`'s success/failure paths, matching the edit
  controller's spec shape from step 03.
- `frontend/spec/components/pages/helpers/CategoryItemHelper_spec.js` —
  cover the delete props reaching `PhotosCarousel` only when `logged` is
  true.
- `frontend/spec/components/pages/CategoryItem_spec.js` — cover the new
  state wiring and `onDeletePhoto` callback.
