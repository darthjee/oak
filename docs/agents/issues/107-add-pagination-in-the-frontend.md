# Issue: Add Pagination in the Frontend

## Parent Issue

Sub-issue of #92 — Use React Front-End.

## Description

Add a reusable `Pagination` element to the new React front-end and wire it into the categories
index page (`/#/categories`). Pagination metadata is read from API response headers, and the
component builds smart page links with gap indicators.

## Expected Behavior

- After `GET /categories.json` responds, its headers contain:
  - `page` — current page number
  - `pages` — total number of pages
  - `per_page` — items per page
- A `Pagination` element is rendered below the category cards
- The page list is built as follows (no duplicate links, gaps shown as `…`):
  - Always include pages 1, 2, 3
  - Always include the last 3 pages (last-2, last-1, last)
  - Always include the current page and 3 pages before and after it
  - Insert a `…` separator wherever there is a gap between consecutive entries
  - Example: total = 20, current = 10 → `1 2 3 … 7 8 9 10 11 12 13 … 18 19 20`
- Each page link navigates to `/#/categories?page=N&per_page=N`
- Previous (`«`) and next (`»`) buttons are included; they are disabled on the first and last page respectively

## Solution

- Create a reusable `Pagination` element following the three-layer pattern:
  - `frontend/assets/js/components/elements/Pagination.jsx` — state + props wiring
  - `frontend/assets/js/components/elements/controllers/PaginationController.jsx` — builds the page list array (with `null` entries for gaps)
  - `frontend/assets/js/components/elements/helpers/PaginationHelper.jsx` — renders Bootstrap pagination links
- Update `CategoriesController.jsx` to read `page`, `pages`, and `per_page` from response headers and pass them as props to `Pagination`
- Update `CategoriesHelper.jsx` to render `<Pagination ... />` below the card grid
- Write Jasmine tests for the controller's page-list algorithm and the helper's rendering

## Reference

- Current AngularJS template: `source/app/views/templates/display/_ng_pagination.html.erb`
- Current pagination logic: https://github.com/darthjee/cyberhawk/blob/master/src%2Fpaginator.js

## Benefits

- Introduces a reusable `Pagination` element that all future list pages can use
- The page-list algorithm is pure logic, making it straightforward to unit-test

---
See issue for details: https://github.com/darthjee/oak/issues/107
