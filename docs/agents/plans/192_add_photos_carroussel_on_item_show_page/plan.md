# Plan: Add Photos Carousel on Item Show Page

## Overview

Add a photos carousel to the item show page in the new React frontend, matching the feature already present in the old Rails/AngularJS frontend. The carousel and its individual photo items will be implemented as reusable React elements using Bootstrap.

## Context

The old carousel lives in `source/app/views/items/_form_carousel.html.erb`. The new frontend (React + Vite in `frontend/`) does not yet render it on the item show page. Following the project's component pattern, the carousel will be split into:
- A `PhotosCarousel` element (the full carousel wrapper)
- A `PhotosCarouselItem` element (a single slide/photo within the carousel)

Both are reusable elements placed under `frontend/assets/js/components/elements/`.

## Implementation Steps

### Step 1 — Create the `PhotosCarouselItem` element

Create a reusable element to render a single photo slide inside the carousel.

- `frontend/assets/js/components/elements/PhotosCarouselItem.jsx` — receives a `photo` prop and delegates rendering to the helper.
- `frontend/assets/js/components/elements/helpers/PhotosCarouselItemHelper.jsx` — static `render(photo)` method returning the Bootstrap carousel slide JSX (`<div class="carousel-item">`).
- Add JSDoc to all public classes and methods.
- Add Jasmine specs under `frontend/spec/`.

### Step 2 — Create the `PhotosCarousel` element

Create a reusable element wrapping multiple `PhotosCarouselItem` components in a Bootstrap carousel.

- `frontend/assets/js/components/elements/PhotosCarousel.jsx` — receives a `photos` prop, manages the active index state with `useState`, delegates rendering to the helper.
- `frontend/assets/js/components/elements/helpers/PhotosCarouselHelper.jsx` — static `render(photos, activeIndex, setActiveIndex)` returning the Bootstrap carousel container JSX (`<div id="..." class="carousel slide">`), composing `PhotosCarouselItem` for each photo and rendering prev/next controls.
- Add JSDoc to all public classes and methods.
- Add Jasmine specs under `frontend/spec/`.

### Step 3 — Integrate into the item show page

Add the `PhotosCarousel` element to the item show page component.

- Update `frontend/assets/js/components/pages/helpers/CategoryItemHelper.jsx` to include `<PhotosCarousel photos={item.photos} />` in the rendered output.
- `photos` is already exposed by the item JSON API via `source/app/decorators/oak/item/show_decorator.rb` — no decorator changes needed.
- Update the item show page specs if needed.

### Step 4 — Tests

- Jasmine specs for `PhotosCarouselItem`: renders the correct image and alt text.
- Jasmine specs for `PhotosCarousel`: renders all items, highlights the active slide, prev/next controls work.
- Update item show page specs to assert the carousel is rendered when photos are present.

## Files to Change

- `frontend/assets/js/components/elements/PhotosCarouselItem.jsx` — new element (single photo slide)
- `frontend/assets/js/components/elements/helpers/PhotosCarouselItemHelper.jsx` — new helper
- `frontend/assets/js/components/elements/PhotosCarousel.jsx` — new element (full carousel)
- `frontend/assets/js/components/elements/helpers/PhotosCarouselHelper.jsx` — new helper
- `frontend/assets/js/components/pages/CategoryItem.jsx` — integrate carousel (if state wiring needed)
- `frontend/assets/js/components/pages/helpers/CategoryItemHelper.jsx` — render carousel
- `frontend/spec/` — new specs for carousel elements and updated page specs

## Notes

- `photos` is already exposed by `source/app/decorators/oak/item/show_decorator.rb` — no backend changes needed.
- Bootstrap's carousel requires a unique `id` attribute — use the item ID or a static string.
- If no photos are present, the carousel should not be rendered (guard in the helper).
