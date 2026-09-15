# Frontend Plan: Photo upload client

Main plan: [plan.md](plan.md)

## Steps

- [01 — Add PhotoUploadClient](frontend/01-add-photo-upload-client.md)
- [02 — Wire upload into the item edit form](frontend/02-wire-upload-into-edit-form.md)
- [03 — Add Jasmine tests](frontend/03-add-jasmine-tests.md)

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Backend and proxy contracts are final and merged (#246, #247) — routes and payload shapes below are read directly from `source/app/controllers/items/photos_controller.rb` and `source/config/routes.rb`, not just the docs, so they're guaranteed current.
- **The frontend never calls Finalize.** By the time the proxy's Submit response (200) reaches the frontend, the photo is already `ready: true` on the backend — the proxy's custom Tent handler calls the status-gate endpoint with `status: "ready"` itself, synchronously, before responding. So the client only needs to sequence Init → Submit and treat a 200 from Submit as done; a refetch of the item after that point will already show the photo as ready.
- `Items::PhotosController#index`/`#show` filter to `ready: true` photos only (`scope.where(ready: true)` for those actions) — this is why it's safe to refetch and display immediately after Submit succeeds, and also why an in-progress (not-yet-submitted) photo never leaks into a photo list.
- `CategoryItemEditHelper.render` is shared between `CategoryItemEdit.jsx` and `CategoryItemNew.jsx` (the new-item page reuses the same helper). The upload UI must be gated on `item.id` being present so it does not appear on the new-item form, which has no `item_id` yet (Init is nested under `/items/:item_id/photos`).
