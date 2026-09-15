# Routes + `Items::PhotosController` (Init / status-gate / Finalize)

Add the two routes and the controller that implements them, per
`docs/agents/photo_upload/contracts.md`.

## Routes

Nest under the existing `categories → items` nesting in
`source/config/routes.rb`:

```ruby
resources :items, only: %i[index show new create edit update] do
  resources :photos, only: %i[create update], controller: 'items/photos'
end
```

This generates:

- `POST /categories/:category_slug/items/:item_id/photos.json` — Init
- `PATCH /categories/:category_slug/items/:item_id/photos/:id.json` —
  status-gate / Finalize

## `Items::PhotosController`

New file, following the `Category::KindsController` nested-controller
pattern (`model_for` for the parent context, no CRUD actions generated
for it):

```ruby
module Items
  class PhotosController < ApplicationController
    include UserRequired

    require_user_for :create, :update

    resource_for Oak::Photo, only: %i[create update], ...

    model_for Oak::Item, id_key: :id, param_key: :item_id

    private

    def photos
      scope = item.photos
      action_name.in?(%w[index show]) ? scope.where(ready: true) : scope
    end
  end
end
```

- **Ownership guard**: both Init (`create`) and the status-gate
  (`update`) must refuse unless `item.user == logged_user`. There's no
  existing per-item ownership guard elsewhere in the codebase to reuse
  (`ItemsController`'s own `edit`/`update` don't currently scope by
  owner) — add an explicit check here (e.g. a `before_action` comparing
  `item.user` to `logged_user`, rendering `403` on mismatch). Do not
  widen this to `ItemsController` itself — out of scope for this issue.
- **Init (`create`)**: build with `photo: { file_name: ... }` from
  `params.require(:photo).permit(:file_name)`, merged with `item:` and
  explicit `ready: false`. Response: `{ id, file_name, ready: false }` —
  see "Response shape" below for why this can't reuse
  `Oak::Photo::Decorator` as-is.
- **status-gate / Finalize (`update`)**: branch on
  `params.require(:status)`:
  - `"uploading"` — refuse (`403`/`422`) if `photo.ready?`; otherwise
    respond `200 { file_path: Oak::Photo::FileUrl-style path }`. Reuse
    the existing deterministic path convention from
    `source/app/models/oak/photo/file_url.rb` (adapt/extract as needed —
    `FileUrl` currently builds a full URL via `Settings.photos_server_url`,
    not a bare relative `file_path`; this action needs the latter).
  - `"ready"` — set `ready: true`, save, respond `200`.
  - Azeroth's generated `update` action won't branch on a body field out
    of the box — override/replace it with a custom action method inside
    this controller rather than relying on `resource_for`'s default
    `update_with` hook alone.

## Response shape

Init's response must not expose `photo_url`/`snap_url` (the file isn't on
disk yet — those URLs would 404). `Oak::Photo::Decorator` exposes both
unconditionally today. Add a small dedicated decorator for the
Init/status-gate responses (e.g. `Oak::Photo::UploadDecorator` exposing
only `id`, `file_name`, `ready`) rather than adding a conditional branch
to the display-facing `Oak::Photo::Decorator`.

## Files to Change

- `source/config/routes.rb` — nest the `photos` resource under `items`.
- `source/app/controllers/items/photos_controller.rb` — new controller,
  Init + status-gate/Finalize actions, ownership guard.
- `source/app/decorators/oak/photo/upload_decorator.rb` — new decorator
  for Init/status-gate responses (`id`, `file_name`, `ready` only).
- `source/spec/controllers/items/photos_controller_spec.rb` — new spec
  (matching `source/spec/controllers/category/kinds_controller_spec.rb`'s
  nested-controller layout): Init success, Init on someone else's item
  (403), status-gate `uploading` success + already-`ready` guard,
  status-gate `ready` success.
