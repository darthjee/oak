# Issue: Add Photos Carrousel on Item Show Page

## Description

The item show page in the new React frontend displays the "Photos" heading but no carousel content, even when the JSON endpoint (`/categories/:slug/items/:id.json`) returns a non-empty `photos` array.

## Problem

`PhotoCarouselItem` wraps `<Carousel.Item>` but does not forward extra props. react-bootstrap's `Carousel` uses `React.cloneElement` to inject `className="active"` (and a ref) into each direct child. Because `PhotoCarouselItem` ignores those injected props, the `active` class never reaches the underlying `<div class="carousel-item">`. Bootstrap CSS hides every `.carousel-item` that lacks `.active` (`display: none`), so all slides stay invisible.

## Root Cause

```jsx
// Before — className injected by Carousel is silently dropped
export default function PhotoCarouselItem({ photo, name }) {
  return (
    <Carousel.Item>   {/* never receives className="active" */}
      <img ... />
    </Carousel.Item>
  );
}
```

## Solution

Forward all extra props from `Carousel` down to `<Carousel.Item>`:

```jsx
export default function PhotoCarouselItem({ photo, name, ...props }) {
  return (
    <Carousel.Item {...props}>
      <img ... />
    </Carousel.Item>
  );
}
```

## Benefits

- Photos carousel is now visible on the item show page in the new frontend.
- Feature parity with the old Rails/AngularJS frontend.

---
See issue for details: https://github.com/darthjee/oak/issues/192
