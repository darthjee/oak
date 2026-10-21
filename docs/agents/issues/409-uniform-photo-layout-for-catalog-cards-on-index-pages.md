# Issue: Uniform photo layout for catalog cards on index pages

## Description

The photo area of the catalog cards on the index pages has no fixed size, so the card grid looks uneven. This issue gives every card the same square photo box, whatever the size or proportions of the uploaded image (the same result Majora gets on its item list pages).

Affected code:

- `frontend/assets/js/components/elements/CatalogCard.jsx`
- `frontend/assets/js/components/elements/OptionalImage.jsx`
- Callers: `CategoriesHelper.jsx` (`#renderCard`), `KindsHelper.jsx` (`#renderCard`), `CategoryItemCard.jsx` (used by `CategoryItemsHelper.jsx`)

## Problem

Catalog cards on the index pages (categories, kinds, category items) render their photo with Bootstrap's `img-fluid` only (`max-width: 100%; height: auto`). As a result:

1. **The photo height follows each image's own aspect ratio.** Portrait photos make tall cards and landscape photos make short ones, so rows look uneven and titles/footers end up at different heights. `card h-100` stretches the card itself, not the image area.
2. **A missing image collapses the card.** `OptionalImage` returns `null` without a `src`, so cards with no photo are shorter than the others.
3. **The image sits inside `card-body`**, under the title, so it is padded instead of edge to edge like a Bootstrap `card-img-top`.

## Expected Behavior

- On the categories, kinds and category items index pages, every card shows a **square photo box of the same size**, edge to edge at the top of the card, whatever the image's proportions.
- Images fill the box proportionally and are cropped around the center (never stretched or squashed).
- A card without a photo still shows the same box, empty with a light background, so every card in a row has the same photo area.
- The boxes stay square across all Bootstrap breakpoints.

## Solution

The box defines the size, not the image. This uses Bootstrap 5.3 utilities (the project is on 5.3.8), so no custom CSS is needed and `frontend/assets/css/main.scss` stays empty:

- Create a new element `frontend/assets/js/components/elements/CardPhoto.jsx` that always renders a `div.card-img-top.ratio.ratio-1x1.bg-body-secondary.overflow-hidden` box, with an `img.object-fit-cover` inside it only when `src` is present (see [Frontend fallback](#frontend-fallback)).
- In `CatalogCard`, render `CardPhoto` as the first child of the card link, outside `card-body`, followed by the `card-body` with the title.
- `OptionalImage` stays unchanged. The detail pages (`CategoryHelper.jsx`, `KindHelper.jsx`) keep using it for a single large image at natural proportions.

### Scope

In scope: the photo area of `CatalogCard` on the three index pages, which share that component:

- Categories index (`CategoriesHelper#renderCard`)
- Kinds index (`KindsHelper#renderCard`)
- Category items index (`CategoryItemCard`, used by `CategoryItemsHelper`)

Out of scope:

- **Category / Kind detail pages** (`CategoryHelper.jsx`, `KindHelper.jsx`): they show a single large image through `OptionalImage`, with no grid to align, so natural proportions are fine. `OptionalImage` stays unchanged.
- **Item photo carousel** (`PhotoCarouselItem.jsx`): its height also jumps between slides, but it is a different component with a different shape and a Delete button under the image. This is left for a follow-up issue that applies the same fixed-ratio box technique there.
- **Backend placeholders**: the decorators already send `/assets/images/category.png` / `kind.png` as `snap_url` when there is no main photo, and that behavior is not changed.

### Shape and crop

- **Shape: square (1:1)**, through Bootstrap's `ratio ratio-1x1`. It handles portrait and landscape photos alike and matches Majora's result. The ratio lives only in `CardPhoto`, so a later switch (e.g. `ratio-4x3`) is a one-class change. No banner/fixed-height variant is added.
- **Fit: cover**, through Bootstrap's `object-fit-cover`. The image scales proportionally to fill the box and the overflow is cropped: no distortion, no letterbox bars. The full image is still available on the detail page.
- **Crop focus: center** (the browser default). No `object-position` is set for now. It can be added later if subjects get cut off.

```jsx
<div className='card-img-top ratio ratio-1x1 bg-body-secondary overflow-hidden'>
  {src && <img src={src} alt={alt} className='object-fit-cover' />}
</div>
```

`.ratio` is `position: relative` with a `::before` padding sized to the ratio, and its direct child is absolutely positioned at `width: 100%; height: 100%`. Together with `object-fit-cover`, it behaves like Majora's `.card-photo-square`. `card-img-top` and `overflow-hidden` are on the wrapper, not the `img`, so the box itself gets the card's inner top radius and clips its content (see [Edge cases](#edge-cases)).

### Frontend fallback

The frontend adds no fallback image. The backend decorators remain the single source of the placeholder (`category.png` / `kind.png`).

- `CardPhoto` **always renders the square box**, so every card keeps the same photo area even without a `src`.
- The `img` is rendered **only when `src` is present**. Without one, the box stays empty with the `bg-body-secondary` light background. There is no broken-image icon.
- There is no `fallbackSrc` prop for now. Adding one later would be backward compatible if a frontend placeholder is ever needed.

### Card structure

The photo comes first, then the title, then the footer:

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

- **Photo on top, outside `card-body`**, edge to edge, with the `CardPhoto` box carrying `card-img-top`. This is the standard Bootstrap card layout. It also makes every photo in a row start at the same height regardless of how many lines the title wraps to.
- **The link is unchanged**: the `<a>` still wraps photo + title, so both are clickable. The footer (e.g. `CategoryItemLinks` on item cards) stays outside the link because it contains links of its own.
- **Long titles wrap naturally.** No truncation is applied. A 2-line title only shifts where the footer starts on item cards that have links, which is acceptable.

### Alternative solutions

| Option | Decision |
| --- | --- |
| Custom `.card-photo-square` rule in `main.scss` (Majora's approach) | Rejected: it reimplements what Bootstrap 5.3 already provides and would add the first custom CSS to an empty `main.scss`. |
| **Bootstrap utilities (`ratio ratio-1x1` + `object-fit-cover`)** | **Chosen**: same result, no new CSS, uses the framework the project already relies on. |
| react-bootstrap `<Ratio>` + `<Card.Img>` | Rejected: `CatalogCard` uses plain Bootstrap classes, not react-bootstrap's `Card`, so this would mix the two styles. |
| Fixed height + `object-fit` (Majora's `.card-photo-rect`) | Rejected: not square (see Shape and crop). |

### Edge cases

- **Very wide or very tall images** (panoramas, screenshots): `cover` crops heavily and only the center is shown. Accepted, since the full image is available on the detail page.
- **Small images** (smaller than the box): `cover` scales them up and they may look blurry. Accepted, since photos come from uploads and this should be rare.
- **Empty string `src`** (`''`): treated like a missing `src`. No `img` is rendered and the empty box stays. Covered by a spec.
- **Dark mode**: `bg-body-secondary` follows the color theme.
- **Rounded corners of the empty box**: `.card` is rounded but has no `overflow: hidden`, so a background-colored box with no `img` would show square top corners past the card's border. Fix: put `card-img-top` and `overflow-hidden` on the wrapper `div` instead of the `img`. The box then gets the card's inner top radius and clips the photo. The `img` needs only `object-fit-cover`, because `.ratio > *` already sizes it to `width/height: 100%`.

Out of scope:

- **Broken image URLs** (a `src` that is set but fails to load): no `onError` handling is added.

### Testing

Specs (run through Oak's docker-compose / make targets, never node/npm on the host):

- `CardPhoto`: the wrapper always renders with `card-img-top ratio ratio-1x1 bg-body-secondary overflow-hidden`. The `img` has `object-fit-cover`, `src` and `alt` when `src` is present. No `img` is rendered when `src` is missing or `''`.
- `CatalogCard` (`frontend/spec/components/elements/CatalogCard_spec.js`): the photo box is rendered before `card-body` inside the link, the title is in `card-body`, the box is present even without `imageSrc`, and the footer stays outside the link.

Manual check:

- [ ] The categories, kinds and category items index pages, with a mix of portrait, landscape and missing images, show identical square photo boxes in every row.
- [ ] Resizing across Bootstrap breakpoints keeps the boxes square.
- [ ] No image is stretched or squashed (only cropped), and the empty box has rounded top corners matching the card.
- [ ] Lint and specs pass.

### Notes from exploration

- The backend decorators already fall back to a placeholder in `snap_url` when there is no main photo: `/assets/images/category.png` (category decorator, category form decorator, item index decorator) and `/assets/images/kind.png` (kind decorator). Index cards therefore normally already receive a `src`, and a frontend fallback would only be a safety net.
- An existing spec covers `CatalogCard`: `frontend/spec/components/elements/CatalogCard_spec.js`.

## Benefits

- A uniform, aligned card grid on all three index pages, through a single change in `CatalogCard`.
- No custom CSS: only Bootstrap 5.3 utilities the project already ships.
- The backend stays the single source of the placeholder image.
- The square shape lives in one class in `CardPhoto`, so changing it later is trivial.
