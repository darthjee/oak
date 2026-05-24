# Issue: Add Index Category Items Page

## Parent Issue

Sub-issue of #92 — Use React Front-End.

## Description

Build the category items index page at `/#/categories/:category_slug/items`, mirroring the
categories index page pattern but scoped to a specific category identified by its slug.

## Expected Behavior

- Navigating to `/#/categories/project/items` fetches `/categories/project/items.json`
- The category slug is extracted from the hash URL
- Items are displayed as cards in a Bootstrap grid, each showing:
  - Item name and snapshot image, linking to `/#/categories/:category_slug/items/:id`
  - An external link (if present in the item's `link` field)
- The page supports pagination (using the `Pagination` element from issue #107); page links
  preserve the category slug in the URL (e.g. `/#/categories/project/items?page=2&per_page=10`)
- "New" and "Edit" buttons are shown when the user is logged in
- Query params are forwarded to the JSON fetch (via `GenericClient.fetchIndex` from issue #109)

## JSON Response Example

```json
[{
  "id": 35,
  "name": "Oak",
  "description": "This project.\nAn app to catalog stuff",
  "category_slug": "project",
  "kind_slug": "rails_app",
  "snap_url": "http://photos.oak.ffavs.net/snaps/users/1/items/35/oak.png",
  "link": { "id": 35, "text": "Github", "url": "https://github.com/darthjee/oak" }
}]
```

## Solution

- Create a `CategoryItems` page following the three-layer pattern:
  - `frontend/assets/js/components/pages/CategoryItems.jsx`
  - `frontend/assets/js/components/pages/controllers/CategoryItemsController.jsx`
  - `frontend/assets/js/components/pages/helpers/CategoryItemsHelper.jsx`
- Extract the category slug from `window.location.hash` in the controller
- Use `GenericClient.fetchIndex` for the data fetch
- Register the route `/#/categories/:slug/items` in `App.jsx`

## Reference

- Current AngularJS template: `source/app/views/items/index.html.erb`

## Benefits

- Delivers the first nested resource page of the React SPA
- Establishes the pattern for extracting URL segments from hash routes

---
See issue for details: https://github.com/darthjee/oak/issues/97
