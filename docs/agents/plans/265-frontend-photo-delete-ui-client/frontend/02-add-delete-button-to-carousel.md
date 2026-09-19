# Add delete button to the photo carousel

Give `PhotoCarouselItem` an optional delete action so `PhotosCarousel`/
`PhotoCarouselItem` stay usable without it (the button only renders when a
delete callback is passed down). Add optional props `onDelete`,
`deleting`, and `error`:

- Render a delete button (e.g. `btn btn-outline-danger`) only when `onDelete`
  is provided; disable it while `deleting` is true.
- On click, call `window.confirm('Delete this photo?')` first; only call
  `onDelete()` if the user confirms. This keeps the confirmation local to
  the button — callers just get an `onDelete` invocation they can trust.
- Render `error`, when present, the same way upload errors are shown
  elsewhere (`ErrorContainer`).

Thread the same three concerns through `PhotosCarousel` as
`onDeletePhoto(photoId)`, `deletingPhotoId`, and `deleteErrorByPhotoId`
(a `{ [photoId]: message }` map), all optional and defaulting to "no delete
action" when omitted (preserves the read-only-without-delete-callback
shape). For each `photo` in the list, pass:

- `onDelete={onDeletePhoto ? () => onDeletePhoto(photo.id) : undefined}`
- `deleting={deletingPhotoId === photo.id}`
- `error={deleteErrorByPhotoId?.[photo.id] || null}`

## Files to Change

- `frontend/assets/js/components/elements/PhotoCarouselItem.jsx` — add the
  `onDelete`/`deleting`/`error` props and the delete button/confirm/error
  rendering described above.
- `frontend/assets/js/components/elements/PhotosCarousel.jsx` — add the
  `onDeletePhoto`/`deletingPhotoId`/`deleteErrorByPhotoId` props and forward
  the per-photo values to each `PhotoCarouselItem`.
- `frontend/spec/components/elements/PhotoCarouselItem_spec.js` — cover: no
  button when `onDelete` is absent; button calls `onDelete` only after a
  confirmed `window.confirm`; button disabled while `deleting`; error
  rendered when present.
- Add/update the `PhotosCarousel` spec (create
  `frontend/spec/components/elements/PhotosCarousel_spec.js` if it does not
  already exist) — cover per-photo prop forwarding by `photo.id`.
