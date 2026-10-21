# Frontend Plan: Uniform photo layout for catalog cards on index pages

Main plan: [plan.md](plan.md)

## Overview
Add a `CardPhoto` element that always renders a fixed square box (`card-img-top ratio ratio-1x1 bg-body-secondary overflow-hidden`) with an `object-fit-cover` image inside only when a `src` is present. Then switch `CatalogCard` to render it as the first child of the card link, above a `card-body` that holds only the title. No custom CSS is added (`frontend/assets/css/main.scss` stays empty), and `OptionalImage` is left untouched for the detail pages.

## Context
`CatalogCard` currently renders `OptionalImage` (`img-fluid`) inside `card-body`, below the title. The photo height therefore follows each image's aspect ratio, and a card without an image is shorter. `CatalogCard` is shared by `CategoriesHelper#renderCard`, `KindsHelper#renderCard` and `CategoryItemCard` (used by `CategoryItemsHelper`), so fixing it fixes all three index pages. The backend already sends a placeholder `snap_url` (`/assets/images/category.png` / `kind.png`) when there is no main photo, so the frontend adds no fallback image. The project is on Bootstrap 5.3.8, which ships `.ratio`/`.ratio-1x1` and `.object-fit-cover`.

Out of scope: the detail pages (`CategoryHelper`, `KindHelper`), `PhotoCarouselItem`, the backend placeholders, and `onError` handling for broken image URLs.

## Implementation Steps

### Step 1 — Add the `CardPhoto` element
Create `frontend/assets/js/components/elements/CardPhoto.jsx`, following the style of the other elements (single quotes, `import React from 'react';`, JSDoc on the default-exported function):

```jsx
import React from 'react';

/**
 * Renders a card photo inside a fixed square box, so every card shows the same photo area.
 *
 * The box is always rendered; the image is rendered only when `src` is present.
 *
 * @param {{src?: string, alt?: string}} props image attributes
 * @returns {JSX.Element} photo box markup
 */
export default function CardPhoto({ src, alt }) {
  return (
    <div className='card-img-top ratio ratio-1x1 bg-body-secondary overflow-hidden'>
      {src && <img src={src} alt={alt} className='object-fit-cover' />}
    </div>
  );
}
```

- `card-img-top` and `overflow-hidden` go on the wrapper (not the `img`), so the box gets the card's inner top radius even when it is empty, and it clips the photo.
- The `img` needs no `w-100 h-100`: `.ratio > *` already positions it absolutely at `width/height: 100%`.

Add `frontend/spec/components/elements/CardPhoto_spec.js` (same `renderToStaticMarkup` style as `OptionalImage_spec.js`):
- renders the wrapper with `card-img-top`, `ratio`, `ratio-1x1`, `bg-body-secondary` and `overflow-hidden` when `src` is present;
- renders an `img` with the given `src`, `alt` and the `object-fit-cover` class when `src` is present;
- still renders the wrapper but no `<img` when `src` is missing;
- still renders the wrapper but no `<img` when `src` is `''`.

### Step 2 — Use `CardPhoto` in `CatalogCard`
In `frontend/assets/js/components/elements/CatalogCard.jsx`, replace the `OptionalImage` import with `CardPhoto` and render the photo first, outside `card-body`:

```jsx
<div className='card h-100'>
  <a href={href} className='text-decoration-none text-dark'>
    <CardPhoto src={imageSrc} alt={imageAlt || title} />
    <div className='card-body'>
      <h5 className='card-title'>{title}</h5>
    </div>
  </a>
  {footer}
</div>
```

Keep the outer `col-sm-6 col-md-4 col-lg-3 mb-4` column, the link and the footer placement unchanged. Update the JSDoc description ("Renders a standard card with a fixed square photo box and optional footer content.").

Extend `frontend/spec/components/elements/CatalogCard_spec.js`:
- renders the photo box (`ratio-1x1`) even without `imageSrc`, with no `<img`;
- renders the image `src` and `alt` from `imageSrc`/`imageAlt`, falling back to `title` for `alt` when `imageAlt` is missing;
- the photo box appears before `card-body` in the markup (compare `indexOf`s), and the title is inside `card-body`;
- the footer is rendered after the closing `</a>` (outside the link).

Check that the existing page/controller specs that render cards (`CategoriesHelper_spec`, `KindsHelper_spec`, `CategoryItemsHelper_spec`, `CategoryItemCard_spec`, and the matching controller specs) still pass. They assert on `snap_url` values and titles, not on `img-fluid`/`card-body`, so no changes are expected there.

## Files to Change
- `frontend/assets/js/components/elements/CardPhoto.jsx` — new element: always-rendered square photo box built from Bootstrap utilities.
- `frontend/spec/components/elements/CardPhoto_spec.js` — new spec for the box/image rendering rules.
- `frontend/assets/js/components/elements/CatalogCard.jsx` — use `CardPhoto` on top of the card, outside `card-body`; drop the `OptionalImage` import.
- `frontend/spec/components/elements/CatalogCard_spec.js` — cover the new structure, the always-present box and the `alt` fallback.

## CI Checks
- `frontend`: `docker-compose run --rm oak_fe npm test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm oak_fe npm run lint` (CI job: `frontend-checks`)

## Notes
- Never run node/npm on the host. Use the docker-compose commands above.
- `OptionalImage` and its spec stay unchanged, since the detail pages still use it.
- `frontend/assets/css/main.scss` must stay empty: no `.card-photo-square` rule.
- Manual check after the change: the categories, kinds and category items index pages, with a mix of portrait, landscape and missing images, show identical square boxes across breakpoints, with no stretched images and rounded top corners on empty boxes.
