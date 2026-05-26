# Issue: Add Index Kinds Page

## Description

The new frontend needs a `/#/kinds` index page that is very similar to `/#/categories`. It loads kind records from the API and displays them as a grid of cards. The implementation should reuse the common components extracted from the existing pages rather than duplicating their structure.

## Problem

- There is no `/#/kinds` page in the new frontend.
- The Categories and CategoryItems pages share duplicated list/card rendering code that should be consolidated before (or alongside) adding this new page.

## Expected Behavior

- `/#/kinds` renders a grid of kind cards using the same visual layout as `/#/categories`.
- Data is loaded from `/kinds.json`.
- Cards link to the kind's detail page (or another appropriate target).
- No links section is shown on cards (kinds have no associated links, and there is no slug-based navigation link).

## Solution

- Extract the common listing and card components from Categories and CategoryItems (see issue #142) so that the new Kinds page can reuse them directly.
- Create the `Kinds` page component, controller, and helper following the existing page pattern.
- Register the `/#/kinds` route in `App.jsx`.

## Benefits

- Completes the frontend coverage for the kinds resource.
- Drives the extraction of shared components, reducing duplication across index pages.

---
See issue for details: https://github.com/darthjee/oak/issues/99
