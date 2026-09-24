# Backend Plan: Switch OAK_PHOTOS_SERVER_URL to the Oak domain

Main plan: [plan.md](plan.md)

## Shared contracts

- `snap_url` when `main_photo` is nil:
  - `Oak::Category::Decorator`, `Oak::Category::FormDecorator`,
    `Oak::Item::IndexDecorator` → `/assets/images/category.png`
  - `Oak::Kind::Decorator` → `/assets/images/kind.png`
- The frontend provides those files; `Oak::Photo::FileUrl` stays unchanged.

## Implementation Steps

### Step 1 — Point placeholders at the frontend assets
In the four decorators, return `'/assets/images/category.png'` (or
`'/assets/images/kind.png'` for `Kind`) when `main_photo` is nil, instead of
`[base_url, '<name>.png'].join('/')`. Remove the now-unused private
`base_url` method from each decorator.

### Step 2 — Update specs
In the four decorator specs, change the placeholder expectation
(`[Settings.photos_server_url, '<name>.png'].join('/')`) to the new
root-relative path. Leave the with-photo expectations (built from
`Settings.photos_server_url`) as they are.

## Files to Change
- `source/app/decorators/oak/category/decorator.rb` — placeholder path, drop `base_url`.
- `source/app/decorators/oak/category/form_decorator.rb` — placeholder path, drop `base_url`.
- `source/app/decorators/oak/kind/decorator.rb` — placeholder path, drop `base_url`.
- `source/app/decorators/oak/item/index_decorator.rb` — placeholder path, drop `base_url`.
- `source/spec/decorators/oak/category/decorator_spec.rb` — new placeholder expectation.
- `source/spec/decorators/oak/category/form_decorator_spec.rb` — new placeholder expectation.
- `source/spec/decorators/oak/kind/decorator_spec.rb` — new placeholder expectation.
- `source/spec/decorators/oak/item/index_decorator_spec.rb` — new placeholder expectation.

## CI Checks
- `source`: `bundle exec rspec` (CI job: `test`)
- `source`: `rubocop` (CI job: `checks`)

## Notes
- No change to `Settings`, `EnvSettings` or `.env*`: `OAK_PHOTOS_SERVER_URL`
  is set only in the Render env, as a manual step after merge.
