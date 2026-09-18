# Backend Plan: Backend — photo deletion endpoints

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Add `deletable.json` and `DELETE` routes/actions to `Items::PhotosController`

- In `source/config/routes.rb`, extend the nested `photos` resource
  (`only: %i[create update]`, `source/config/routes.rb:27`) to also allow
  `destroy`, and add a custom member route for the pre-delete check:

  ```ruby
  resources :photos, only: %i[create update destroy], controller: 'items/photos' do
    member { post :deletable }
  end
  ```

- In `source/app/controllers/items/photos_controller.rb`:
  - Add `destroy` to the `resource_for Oak::Photo, only: %i[create update]`
    list (`source/app/controllers/items/photos_controller.rb:10-13`) so the
    `inherited_resources`-backed default `destroy` action (204 No Content on
    success) becomes available. `before_action :ensure_owner!` already runs
    for every action, so ownership is checked once via the existing gate;
    re-verify this still satisfies the issue's "re-checked, defense in
    depth" requirement — if `inherited_resources`' default `destroy` doesn't
    naturally re-check ownership on the loaded resource beyond
    `ensure_owner!`, add an explicit check in a custom `destroy` override
    instead of relying solely on the default action.
  - Add a `deletable` action (mirroring `gate_uploading`'s shape): returns
    `422 Unprocessable Content` unless `photo.ready?`, otherwise renders
    `{ file_path: }` with `status: :ok` — reuse the existing private
    `file_path` helper (`source/app/controllers/items/photos_controller.rb:68-70`).
  - Deleting an already-deleted or nonexistent photo id must return `404` —
    confirm this falls out naturally from `Oak::Item#photos` /
    `model_for`/`resource_for` resource lookup (`RecordNotFound` → 404 is
    Rails' default); add an explicit `rescue_from` only if it doesn't.
  - `ready: false` photos are out of scope for `destroy`/`deletable` beyond
    the `deletable` gate above — no additional handling needed.
  - No `order`-column resequencing needed anywhere in this change.

## Files to Change

- `source/config/routes.rb` — add `destroy` to the photos resource and a
  `deletable` member route.
- `source/app/controllers/items/photos_controller.rb` — add `destroy` to
  `resource_for`'s `only:` list and implement the `deletable` action.

### Step 2 — RSpec coverage

Add to `source/spec/controllers/items/photos_controller_spec.rb`, following
the existing `describe 'PATCH #update'` block's structure and `context`
naming (owner / non-owner / not-logged-in) already used for `create` and
`update`:

- `POST #deletable`:
  - when the photo is `ready: true` (owner) → `200`, body
    `{ 'file_path' => "users/#{user.id}/items/#{item.id}/#{photo.file_name}" }`.
  - when the photo is `ready: false` (owner) → `422`.
  - when the user does not own the item → `403`.
  - when the user is not logged in → redirect (`302`/`:found`), matching
    the existing pattern in the `create`/`update` specs.
- `DELETE #destroy`:
  - when the photo is owned by the user → `204`, and
    `expect { delete :destroy, params: }.to change(Oak::Photo, :count).by(-1)`.
  - when the user does not own the item → `403`, and does not change
    `Oak::Photo.count`.
  - when the photo id doesn't exist (or was already deleted) → `404`.
  - when the user is not logged in → redirect, matching the existing
    pattern.

## Files to Change

- `source/spec/controllers/items/photos_controller_spec.rb` — add
  `describe 'POST #deletable'` and `describe 'DELETE #destroy'` blocks.

## CI Checks

- `source`: `cd source && bundle exec rspec` (CI job: `test`)
- `source`: `rubocop` (CI job: `checks`)

## Notes

- Both endpoints are called only by the proxy (issue #262), never directly
  by the frontend — no CORS/CSRF concerns beyond what `Items::PhotosController`
  already handles (`protect_from_forgery except: %i[create update]` already
  excludes the mutating actions it lists; confirm whether `destroy` also
  needs adding to that `except:` list, since it's a state-changing action
  reached the same way `create`/`update` are).
- No file-system deletion happens here — that's proxy-owned (issue #262),
  which calls `deletable.json` first, deletes the file, then calls this
  `DELETE` endpoint per the parent issue #261's documented ordering.
- No `order`-column resequencing, no bulk delete — out of scope per the
  issue.
