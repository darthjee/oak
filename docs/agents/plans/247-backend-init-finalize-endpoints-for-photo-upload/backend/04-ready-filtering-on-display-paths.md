# `ready` filtering on every display path

A not-yet-`ready` photo must never render as a broken image. Two separate
code paths surface photos, and each needs its own filtering (per
`docs/agents/photo_upload/data-model-and-migration.md`):

1. **`Items::PhotosController#photos`** (Step 03) — already scopes
   `index`/`show` to `ready: true` while leaving `create`/`update`
   unscoped. No further work here.
2. **Direct model/decorator reads**, which bypass that controller method
   entirely:
   - `Oak::Item#main_photo`, `Oak::Category#main_photo`,
     `Oak::Kind#main_photo` — pure-display associations with no competing
     unscoped use case. Scope them directly:
     ```ruby
     has_one :main_photo, -> { where(ready: true) }, class_name: 'Oak::Photo'
     ```
     (`Category`/`Kind`'s `main_photo` already carries an `-> { order(:id) }`
     lambda through `sample_item` — extend it, don't replace it.)
   - `Oak::Item#photos` **must stay unscoped** at the association level —
     `Items::PhotosController#photos` (Step 03) legitimately reads/writes
     not-yet-ready rows through this same association for Init/status-gate.
     Add the `ready: true` filtering instead where it's read for display:
     `Oak::Item::ShowDecorator#photos` (currently
     `expose :photos, decorator: Oak::Photo::Decorator`, calling
     `object.photos` directly) — change the expose to call
     `object.photos.where(ready: true)` explicitly rather than exposing
     the raw association.
   - `Oak::Item::IndexDecorator` already goes through `main_photo`
     (`item.rb`'s `has_one`), so it's covered by the `main_photo` scope
     change above — verify there's no second direct `.photos` read there.

## Files to Change

- `source/app/models/oak/item.rb` — scope `main_photo` to `ready: true`.
- `source/app/models/oak/category.rb` — extend `main_photo`'s existing
  `-> { order(:id) }` lambda with `ready: true`.
- `source/app/models/oak/kind.rb` — same as `category.rb`.
- `source/app/decorators/oak/item/show_decorator.rb` — filter `photos` to
  `ready: true` at the decorator level, not the association.
- `source/spec/models/oak/item_spec.rb`,
  `source/spec/models/oak/category_spec.rb`,
  `source/spec/models/oak/kind_spec.rb` — assert `main_photo` excludes
  `ready: false` photos.
- `source/spec/decorators/oak/item/show_decorator_spec.rb` — assert
  `photos` excludes `ready: false` photos.
