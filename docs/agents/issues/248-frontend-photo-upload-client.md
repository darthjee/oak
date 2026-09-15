# Issue: Frontend — Photo upload client

## Description
Implement the frontend client that drives the Init and Submit steps of the photo upload flow from the item edit form, per the contract settled in `docs/agents/photo_upload/*.md`. This is the frontend leg of the three-part photo upload feature; the Docs (#245), Proxy (#246), and Backend (#247) sub-issues are all merged, so the contract this issue builds against is final.

## Solution
- A new client (mirroring the role of majora's `UploadClient`, built on raw `fetch` rather than extending `GenericClient` since it needs `multipart/form-data`, which `GenericClient` doesn't support today) that, given a single selected file on the item edit form (one file at a time, no batch/multi-file upload):
  1. Calls the backend Init endpoint (`POST /categories/:category_slug/items/:item_id/photos.json`) to allocate the `Oak::Photo` record and obtain its `id`.
  2. Submits the binary payload via multipart to the proxy's Submit endpoint (`POST /uploads/categories/:category_slug/items/:item_id/photos/:id/submit`).
  3. Treats a 200 from Submit as upload completion. **The frontend does not call Finalize itself** — per `docs/agents/photo_upload/contracts.md` ("Submit", step 5: "The frontend never calls Finalize itself") and the already-merged #246, the Tent proxy calls the status-gate endpoint with `status: "ready"` on the backend itself, right after writing the file. This corrects an earlier draft of this issue, which had the frontend chaining a Finalize call — that was majora's own frontend gap, but is not what Oak's settled proxy-owned design calls for.
- Wire the client into the item edit form UI (`frontend/assets/js/components/pages/CategoryItemEdit.jsx` and its controller/helper), with upload progress/error states consistent with the existing save-flow patterns (e.g. `CategoryItemEditController`'s `saving`/`error` state handling).
- Jasmine tests for the client and the form integration.

### Out of scope
- Backend Init/status-gate/Finalize endpoints themselves (#247, merged).
- The Tent proxy Submit/Finalize rule itself (#246, merged).
- Wiring photo upload into the item *creation* form (`CategoryItemNew.jsx`) — Init requires an existing `item_id`, which a not-yet-saved new item doesn't have; open question below.

## Benefits
Completes the three-part photo upload feature, letting users upload photos directly from the web UI instead of only through the filesystem scan job.
