# Add Jasmine tests

Cover the new client and the form integration, following the existing spec conventions (`stubFetchResponse`/`preserveGlobals` from `frontend/spec/support/factories.js`, one `describe` per method).

`PhotoUploadClient_spec.js`:
- `#init` — sends the right method/URL/body, returns the parsed photo, throws on non-`ok`.
- `#submit` — sends `multipart/form-data` with the file under `file`, throws on non-`ok`, does not call any Finalize-shaped endpoint (assert `fetch` is called exactly the expected number of times/with the expected URLs across a full `#upload` run, so a regression that adds a stray Finalize call is caught).
- `#upload` — calls `init` then `submit` in order, returns `init`'s result, propagates a rejection from either step.

`CategoryItemEditController_spec.js` additions (alongside the existing `#save` tests):
- `#uploadPhoto` — happy path calls `PhotoUploadClient#upload` with the resolved `slug`/`id`/`file`, sets/clears `uploading`, refetches and applies the item on success; error path sets `uploadError` and clears `uploading`; guard path (missing `slug`/`id`/`file`) mirrors `#save`'s guard test.

`CategoryItemEdit_spec.js` / `CategoryItemEditHelper` coverage:
- Upload section renders when `item.id` is present, and is absent on the new-item page path (reuse whatever fixture `CategoryItemNew_spec.js` already uses for an item without an `id`, to assert the section is gated off there too).
- Clicking upload with a selected file calls the passed-in handler; `uploading`/`uploadError` states render the same way the existing `saving`/`error` tests assert for `Save`.

## Files to Change

- `frontend/spec/client/PhotoUploadClient_spec.js` — new file.
- `frontend/spec/components/pages/controllers/CategoryItemEditController_spec.js` — extend with `#uploadPhoto` cases.
- `frontend/spec/components/pages/CategoryItemEdit_spec.js` — extend with upload-section render/interaction cases.
- `frontend/spec/components/pages/CategoryItemNew_spec.js` — extend with a case asserting the upload section stays hidden.
