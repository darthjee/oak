# Plan: Extract Common Components

## Overview

Both index pages (`/#/categories` and `/#/categories/:slug/items`) already share `CatalogCard` for item rendering, and both use plain `<a href>` anchors for navigation (no React Router). What still needs to be extracted is the common **list container** structure, and the category items page needs to be updated to render all item links (plural) using the existing `CategoryItemLinks` element rather than the current single-link footer.

## Context

- `CatalogCard` (`elements/CatalogCard.jsx`) already exists: accepts `href`, `title`, `imageSrc`, `footer`. The configurable click target is already solved.
- `CategoryItemLinks` and `CategoryItemLink` (`elements/`) already exist: render a full list of links from an array.
- Both helpers duplicate the same list container: `<div className='container mt-4'><div className='row'>…</div></div>`.
- `CategoryItemsHelper` currently only renders a **single** external link (`item.link`) via a private `#renderExternalLink` method, ignoring the plural `item.links` array.

## Implementation Steps

### Step 0 — Expose `links` in `Oak::Item::IndexDecorator`

Add `expose :links, decorator: Oak::Link::Decorator` to `source/app/decorators/oak/item/index_decorator.rb` so the index JSON response includes the full links array alongside the existing `link` (main link). Write/update the decorator spec.

### Step 1 — Create `CatalogList` element

Create `frontend/assets/js/components/elements/CatalogList.jsx`. It receives a `children` prop and renders the shared container:

```jsx
<div className='container mt-4'>
  <div className='row'>
    {children}
  </div>
</div>
```

No controller or helper needed — it is a pure layout wrapper.

### Step 2 — Create `CategoryItemCard` element

Create `frontend/assets/js/components/elements/CategoryItemCard.jsx`. It wraps `CatalogCard` and automatically passes `<CategoryItemLinks links={links} />` as the footer:

```jsx
<CatalogCard href={href} title={title} imageSrc={imageSrc} footer={<CategoryItemLinks links={links} />} />
```

Props: `href`, `title`, `imageSrc`, `links` (array).

### Step 3 — Refactor `CategoriesHelper`

Replace the inline container/row JSX inside `render()` with `<CatalogList>`. The `#renderCard` method and `CatalogCard` usage stay unchanged.

### Step 4 — Refactor `CategoryItemsHelper`

- Replace the inline container/row JSX inside `render()` with `<CatalogList>`.
- Replace `#renderCard` to use `CategoryItemCard` instead of `CatalogCard` + `#renderExternalLink`. Pass `item.links` (plural array) to `CategoryItemCard`.
- Remove the now-unused `#renderExternalLink` private method.

### Step 5 — Add tests

Write Jasmine specs for:
- `CatalogList` — renders children inside the expected container structure.
- `CategoryItemCard` — renders `CatalogCard` with `CategoryItemLinks` as footer; renders nothing for the footer when `links` is empty.

Update existing specs for `CategoriesHelper` and `CategoryItemsHelper` to reflect the new elements used.

## Files to Change

- `source/app/decorators/oak/item/index_decorator.rb` — expose `links` array alongside existing `link`
- `source/spec/decorators/oak/item/index_decorator_spec.rb` — add coverage for `links`
- `frontend/assets/js/components/elements/CatalogList.jsx` — **new** generic list container element
- `frontend/assets/js/components/elements/CategoryItemCard.jsx` — **new** category-item card wrapping `CatalogCard` + `CategoryItemLinks`
- `frontend/assets/js/components/pages/helpers/CategoriesHelper.jsx` — use `CatalogList` wrapper
- `frontend/assets/js/components/pages/helpers/CategoryItemsHelper.jsx` — use `CatalogList` + `CategoryItemCard`, drop `#renderExternalLink`
- `frontend/spec/` — new specs for `CatalogList` and `CategoryItemCard`; updated specs for the two helpers

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source/` (decorator + spec): `docker-compose exec oak_app bundle exec rspec` (CircleCI job: `test`) and `docker-compose exec oak_app bundle exec rubocop` (CircleCI job: `checks`)
- `frontend/` (new elements + updated helpers + specs): `docker-compose exec oak_fe npm test` (CircleCI job: `jasmine`) and `docker-compose exec oak_fe npm run lint` (CircleCI job: `frontend-checks`)

## Notes

- Routing: plain `<a href>` anchors are used everywhere; no React Router involved.
- `CatalogCard` already exists and is already the shared item element — no renaming needed.
- The API currently exposes only `main_link` as `link` (singular) in `IndexDecorator`. Step 0 adds `links` (plural array) to the response; the existing `link` field is kept for backwards compatibility.
