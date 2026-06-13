# Issue: Add Photos Carrousel on Item Show Page

## Description

The item show page in the new React frontend is not displaying the photos carousel that exists in the old Rails/AngularJS frontend.

## Problem

- The new frontend's item show page does not render the photos carousel.
- The existing carousel is implemented as a Rails partial at `source/app/views/items/_form_carousel.html.erb`, which is only used by the old frontend.

## Expected Behavior

- The item show page in the new React frontend should display a photos carousel.
- Individual photos within the carousel should be extracted as separate React components/elements.

## Solution

- Create a new React component for the photos carousel using React and Bootstrap.
- Extract individual photo items from the carousel into their own sub-component.
- Reference the old carousel partial (`source/app/views/items/_form_carousel.html.erb`) as a guide for the expected structure and behavior.

## Benefits

- Feature parity between the old and new frontends for the item show page.
- Improved user experience with a modern, React/Bootstrap-based carousel.

---
See issue for details: https://github.com/darthjee/oak/issues/192
