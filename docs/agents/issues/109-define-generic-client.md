# Issue: Define Generic Client

## Parent Issue

Sub-issue of #92 — Use React Front-End.

## Description

Extract the repeated fetch logic from individual page controllers into a shared `GenericClient`
that handles query param forwarding and pagination header reading in a consistent way across all
pages.

## Problem

- Every page controller independently fetches a JSON endpoint, reads hash query params, and
  (on index pages) reads `page`, `pages`, `per_page` from response headers
- This logic is duplicated as more pages are added
- Inconsistencies between pages become likely over time

## Expected Behavior

- A `GenericClient` (or similar) encapsulates:
  1. Reading query params from the hash URL and forwarding them to the fetch URL
  2. Performing the `fetch` and returning the JSON body
  3. On index pages: also reading `page`, `pages`, `per_page` from response headers and
     returning them alongside the data
- Individual page controllers use `GenericClient` instead of calling `fetch` directly
- Index vs non-index behaviour is configurable per page (e.g. a flag or a separate method)

## Solution

- Create `frontend/assets/js/client/GenericClient.js`:
  - `fetch(path)` — reads hash query params, appends them to `path`, calls `fetch`, returns JSON
  - `fetchIndex(path)` — same as above but also extracts and returns pagination headers
- Update existing controllers (`CategoriesController`) to use `GenericClient`
- Write unit tests for both methods

## Benefits

- Single place to change fetch behaviour (auth headers, error normalisation, base URL)
- Ensures consistent query-param forwarding and pagination handling across all pages
- Makes individual controllers simpler and easier to test

---
See issue for details: https://github.com/darthjee/oak/issues/109
