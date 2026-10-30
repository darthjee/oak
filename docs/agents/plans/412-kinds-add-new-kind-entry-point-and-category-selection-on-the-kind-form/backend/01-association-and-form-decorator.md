# Kind/category association and form decorator

Add the reverse association so a kind knows its categories, and a decorator exposing them for the kind form.

- `Oak::Kind`: add `has_many :category_kinds, class_name: 'Oak::CategoryKind', dependent: :destroy` and `has_many :categories, through: :category_kinds, source: :category` (mirroring `Oak::Category`).
- Add `Oak::Category::SelectDecorator` (exposes `name`, `slug`), mirroring `Oak::Kind::SelectDecorator`, so the kind JSON does not trigger `snap_url`/`main_photo` lookups per category.
- Add `Oak::Kind::FormDecorator` exposing `name`, `slug`, `snap_url` (same logic as `Oak::Kind::Decorator`) and `categories` with `decorator: Oak::Category::SelectDecorator`, mirroring `Oak::Category::FormDecorator`.
- Specs: model association specs, and decorator specs for both new decorators (including `categories: []` for a kind with no links).

## Files to Change
- `source/app/models/oak/kind.rb` — add `category_kinds` / `categories` associations.
- `source/app/decorators/oak/category/select_decorator.rb` — new.
- `source/app/decorators/oak/kind/form_decorator.rb` — new.
- `source/spec/models/oak/kind_spec.rb` — association specs.
- `source/spec/decorators/oak/category/select_decorator_spec.rb` — new.
- `source/spec/decorators/oak/kind/form_decorator_spec.rb` — new.
