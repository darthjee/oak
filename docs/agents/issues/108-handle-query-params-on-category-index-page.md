# Issue: Handle Query Params on Category Index Page

## Parent Issue

Sub-issue of #92 — Use React Front-End.

## Description

When navigating to `/#/categories` with query parameters (e.g. `/#/categories?page=2&per_page=10`),
the `CategoriesController` must read those params from the URL and forward them to the
`GET /categories.json` fetch call so the API returns the correct page of results.

## Problem

- After issue #107 adds pagination, clicking a page link navigates to `/#/categories?page=N&per_page=N`
- Without this issue, `CategoriesController` always fetches `/categories.json` with no params,
  so navigating to page 2 still shows page 1

## Expected Behavior

- Navigating to `/#/categories?page=2&per_page=10` causes the page to fetch
  `/categories.json?page=2&per_page=10`
- Any query parameter present in the hash URL is forwarded to the JSON fetch
- If no query params are present, the fetch behaves as before (default page)

## Solution

- Update `CategoriesController.jsx` to read query params from `window.location.hash`
  (or from a React Router location if routing is in place) and append them to the fetch URL
- The extraction logic can live in a helper method or utility function

## Benefits

- Completes the pagination flow started in #107 — users can actually navigate between pages
- Establishes the pattern for forwarding query params that all future paginated pages will follow

---
See issue for details: https://github.com/darthjee/oak/issues/108
