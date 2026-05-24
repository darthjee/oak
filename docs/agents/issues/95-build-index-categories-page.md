# Issue: Build Index Categories Page

## Parent Issue

Sub-issue of #92 — Use React Front-End.

## Description

Build the categories index page for the new React front-end, accessible at `/#/categories`.
The page fetches all categories from the JSON API and displays them as cards.

## Expected Behavior

- Navigating to `/#/categories` renders the categories index page
- The page fetches `GET /categories.json` on load, which returns an array like:
  ```json
  [{ "name": "Project", "slug": "project", "snap_url": "http://..." }]
  ```
- Each category is displayed as a card containing:
  - The category name
  - A snapshot image (`snap_url`)
  - A link to `/#/categories/:slug/items` (the items index for that category, added in a future issue)
- A "New" button is shown at the top when the user is logged in
- Pagination is out of scope and will be added in a future issue

## Solution

- Create a `Categories` page following the three-layer component pattern documented in `docs/agents/frontend.md`:
  - `frontend/assets/js/components/pages/Categories.jsx` — state + wiring
  - `frontend/assets/js/components/pages/controllers/CategoriesController.jsx` — fetches `/categories.json`
  - `frontend/assets/js/components/pages/helpers/CategoriesHelper.jsx` — renders the card grid
- Register the `/#/categories` route in `App.jsx`
- Write Jasmine tests for all three layers

## Reference

- Current AngularJS implementation: `source/app/views/categories/_index.html.erb`
- Live example: `https://oak.ffavs.net/#/categories`

## Benefits

- Delivers the first real content page of the new React SPA
- Establishes the Page + Controller + Helper pattern for all subsequent resource pages

---
See issue for details: https://github.com/darthjee/oak/issues/95
