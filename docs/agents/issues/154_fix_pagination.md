# Issue: Fix Pagination

## Description
When clicking a pagination link in the new frontend, the URL changes correctly but the page content is not reloaded.

## Problem
- Clicking a pagination link updates the browser URL as expected
- However, the page does not reload or re-fetch data to reflect the new page
- The user is left with stale content despite the URL indicating a different page

## Expected Behavior
- Clicking a pagination link should update the URL **and** trigger a content reload for the new page

## Solution
- Investigate how the pagination link navigation is handled in the frontend
- Ensure that a URL change caused by pagination triggers the appropriate data-fetch/re-render cycle (e.g., watching `$location` or `$routeParams` in AngularJS and reloading the resource on change)

## Benefits
- Users can navigate between pages correctly without a full browser refresh
- Pagination works as expected in the single-page application flow

---
See issue for details: https://github.com/darthjee/oak/issues/154
