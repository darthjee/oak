# Issue: Add Show Category Item Page

## Parent Issue

Sub-issue of #92 — Use React Front-End.

## Description

Build the show page for a category item at `/#/categories/:category_slug/items/:id`, displaying
full item details including metadata, external links, and a photo carousel.

## Expected Behavior

- Navigating to `/#/categories/project/items/35` fetches `/categories/project/items/35.json`
- The page displays:
  - A "Back" button linking to `/#/categories/:category_slug/items`
  - An "Edit" button (shown only when logged in)
  - A card with:
    - Item name as header
    - Category name (read-only)
    - Kind name (read-only)
    - Description
  - A links section listing all external links (each opens in a new tab)
  - A photo carousel (shown only when `photos` is non-empty)

## JSON Response Example

```json
{
  "id": 57,
  "name": "Pirata",
  "description": "Pirata",
  "visible": true,
  "category": { "name": "Propostas Pintura Miniaturas", "slug": "propostas_pintura_miniaturas" },
  "kind": { "name": "Propostas Pintura IA", "slug": "propostas_pintura_ia" },
  "photos": [
    { "photo_url": "http://photos.oak.ffavs.net/photos/users/1/items/57/01.png", "snap_url": "..." }
  ],
  "links": [
    { "id": 71, "text": "STL", "url": "https://app.lootstudios.com/miniature/matt-jones/" }
  ]
}
```

## Solution

- Create a `CategoryItem` page following the three-layer pattern:
  - `frontend/assets/js/components/pages/CategoryItem.jsx`
  - `frontend/assets/js/components/pages/controllers/CategoryItemController.jsx`
  - `frontend/assets/js/components/pages/helpers/CategoryItemHelper.jsx`
- Extract `category_slug` and `id` from the hash URL
- Use `GenericClient.fetch` (no pagination needed)
- Use `react-bootstrap` `Carousel` component for the photo carousel
- Register the route `/#/categories/:slug/items/:id` in `App.jsx`

## Reference

- Current AngularJS templates: `source/app/views/items/_form.html.erb`, `_form_data.html.erb`,
  `_form_links.html.erb`, `_form_carousel.html.erb`

## Benefits

- Delivers the first show/detail page of the React SPA
- Establishes the pattern for extracting multiple URL segments from hash routes

---
See issue for details: https://github.com/darthjee/oak/issues/98
