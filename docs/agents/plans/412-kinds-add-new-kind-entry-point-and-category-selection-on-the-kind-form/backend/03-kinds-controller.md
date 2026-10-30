# Wire builders and params into KindsController

Mirror `CategoriesController`:

- Use `Oak::Kind::FormDecorator` for `new create show edit update`, and add `build_with: :create_kind` / `update_with: :update_kind`.
- `kind_params`: `params.require(:kind).permit(:name, categories: [:slug])`.
- `create_params`: `kind_params.to_h.deep_symbolize_keys.merge(scope: Oak::Kind.all)`; `update_params`: same merged with `kind:`. Make sure that on update a request without a `categories` key passes no `categories` (→ `nil`, links untouched), while an explicit `categories: []` reaches the builder as `[]` (see the Notes in [backend.md](../backend.md)).
- `create_kind` / `update_kind` call `Oak::Kind::CreateBuilder.build` / `Oak::Kind::UpdateBuilder.build`.
- Controller specs (`spec/controllers/kinds_controller_spec.rb`): JSON of new/show/edit includes `categories`; create links the given categories; update syncs (add/remove); update with `categories: []` unlinks all; update without `categories` key keeps links; unknown slugs ignored; existing login-required behavior unchanged.

## Files to Change
- `source/app/controllers/kinds_controller.rb` — decorator, builders, params.
- `source/spec/controllers/kinds_controller_spec.rb` — new cases.
