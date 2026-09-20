# Kind Pages — Backend Contracts

[← Back to Kind Pages](../kind.md)

Concrete routes, controller wiring, and request/response shapes for #273
to implement against. `Oak::Kind` (`source/app/models/oak/kind.rb`) is
much simpler than `Oak::Category`: a single `name` attribute (slug is
derived automatically via the `Slugable` concern) and no association the
edit form needs to manage — so, unlike `Oak::Category::UpdateBuilder`, no
new builder class is needed.

## Routes

Extend the existing `kinds` resource in `source/config/routes.rb` (it
currently only declares `index new create show`):

```ruby
resources :kinds, only: %i[index new create show edit update], param: :slug
```

- **Edit (form data)** — `GET /kinds/:slug/edit.json`
- **Update** — `PATCH /kinds/:slug.json`

## Controller wiring

Extend the second `resource_for Oak::Kind` call in
`source/app/controllers/kinds_controller.rb` (the one already handling
`new`/`create`/`show`) to also cover `edit`/`update`:

```ruby
resource_for Oak::Kind,
             only: %i[new create show edit update],
             decorator: Oak::Kind::Decorator,
             id_key: :slug,
             param_key: :slug,
             paginated: false
```

No `update_with:` option is needed. Azeroth's `Azeroth::RequestHandler::Update`
falls back to `resource.update(attributes)` when no `update_with` is
configured (see `Azeroth::RequestHandler::Update#update_and_save_resource`)
— exactly what a single-attribute model like `Kind` needs, unlike
`Category` (which needs `update_with: :update_category` to also
reconcile its `kinds` association via `Oak::Category::UpdateBuilder`).

Also add `edit`/`update` to `require_user_for` (currently `:new, :create`
only), mirroring `CategoriesController`'s
`require_user_for :new, :create, :edit, :update`:

```ruby
require_user_for :new, :create, :edit, :update
```

## Strong params

Reuse the existing `kind_params` method unchanged — the edit form only
ever writes `name`:

```ruby
def kind_params
  params.require(:kind).permit(:name)
end
```

## Decorator

Reuse `Oak::Kind::Decorator` unchanged (`source/app/decorators/oak/kind/decorator.rb`)
— it already exposes `name`, `slug`, `snap_url`, which is everything the
edit form needs to pre-populate and everything the update response needs
to return. No new decorator (no `Oak::Kind::FormDecorator` needed the way
`Category` has one, since `Category`'s form decorator additionally exposes
`kinds`).

## Request/response shapes

### Edit (`GET /kinds/:slug/edit.json`)

Same shape as `show`:

```json
{ "name": "Miniature", "slug": "miniature", "snap_url": "https://.../miniature/snap.jpg" }
```

### Update (`PATCH /kinds/:slug.json`)

Request:

```json
{ "kind": { "name": "New Kind Name" } }
```

Success (`200`) — the slug is regenerated from the new name via
`Slugable`'s `name=` override, and the decorated kind is returned:

```json
{ "name": "New Kind Name", "slug": "new_kind_name", "snap_url": "https://.../new_kind_name/snap.jpg" }
```

Validation failure (`422`) — Azeroth renders the same decorated shape
(`model.decorate(resource)`, see `Azeroth::RequestHandler#process`)
regardless of success, so the response body has the same three fields as
above, just reflecting the rejected input; **no `errors` key is included**
(the `Decorator` doesn't expose `.errors`, matching what
`Oak::Category::FormDecorator` does today for `Category`'s own
create/update failures). The frontend must not attempt to parse
field-level errors out of the response body — see
[Validation/error states](#validationerror-states) below and
[Frontend Pages](frontend-pages.md) for how `KindEditController` surfaces
a single generic error message, mirroring `CategoryEditController`.

## Validation/error states

`Oak::Kind` itself only validates `name` (`presence: true, length: { maximum: 40 }`).
Uniqueness is enforced indirectly, through the `Slugable` concern's
`validates :slug, presence: true, uniqueness: true` — `name=` derives
`slug` automatically, so:

- **Duplicate name** — a new/updated name that normalizes to a `slug`
  already used by another `Kind` row fails the `slug` uniqueness
  validation → `422`. (The `kinds`/`slug` DB columns both carry a unique
  index — `db/schema.rb`'s `index_kinds_on_name`/`index_kinds_on_slug` —
  but the model-level `slug` uniqueness validation is what actually
  produces a clean `422` instead of an `ActiveRecord::RecordNotUnique`
  raised from the DB constraint.)
- **Invalid/missing slug** — since `slug` is always derived from `name`
  (never submitted directly by the frontend — `kind_params` doesn't
  permit `slug`), "invalid slug" in practice means "blank/whitespace-only
  `name`", which the `slug`/`name` presence validations both reject with
  `422`.
- **Any other validation failure** (e.g. `name` over 40 chars) — same
  `422` response shape.

In every case, the response is `422` with the decorated-but-invalid
resource and no error detail; #274's `KindEditController` must handle this
the same generic way `CategoryEditController` handles its own `422`s (see
[Frontend Pages](frontend-pages.md)).
