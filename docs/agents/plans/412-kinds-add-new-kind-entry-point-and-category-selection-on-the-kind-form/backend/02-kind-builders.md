# Kind create/update builders

Add builders that create/update a kind and sync its category links in a single transaction, mirroring `Oak::Category::CreateBuilder` / `UpdateBuilder` (`Sinclair::Model`, `.build(**params)`, rescue `ActiveRecord::RecordInvalid` returning the record so errors render).

- `Oak::Kind::CreateBuilder` — `initialize_with({ scope: nil, name: nil, categories: [] }, **{})`. Builds the kind from `scope` (default `Oak::Kind.all`), then builds a `category_kinds` entry for each category found by slug; unknown slugs are skipped.
- `Oak::Kind::UpdateBuilder` — `initialize_with(:kind, { name: nil, categories: nil }, **{})`. Assigns `name`; **when `categories` is `nil`, leaves links untouched**. Otherwise does a full sync: destroys `category_kinds` whose category slug is not in the list, builds entries for newly listed categories (unknown slugs skipped), then `kind.save!`.
- Specs: mirror `spec/builders/oak/category/*_builder_spec.rb`. Cover: create with/without categories, unknown slugs, invalid name (record returned, nothing persisted); update adds, removes, keeps, `categories: []` unlinks all, `categories: nil` leaves links untouched, invalid name rolls back link changes.

## Files to Change
- `source/app/builders/oak/kind/create_builder.rb` — new.
- `source/app/builders/oak/kind/update_builder.rb` — new.
- `source/spec/builders/oak/kind/create_builder_spec.rb` — new.
- `source/spec/builders/oak/kind/update_builder_spec.rb` — new.
