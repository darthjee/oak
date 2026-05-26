# Issue: Extract Common Components

## Description

The new frontend has two pages — index categories (`/#/categories`) and index category items (`/#/categories/:slug/items`) — that share a very similar list display, where items are shown with a `snap_url` for a picture. Common elements should be extracted into reusable components to support future index pages with the same layout.

## Problem

- The category index page and the category items index page duplicate list/item rendering logic.
- There is no shared base component to apply to new index pages that follow the same pattern.
- The click navigation target differs per page, and there is no mechanism to configure it.

## Expected Behavior

- A common listing component wraps the shared list structure.
- A common item component handles the shared picture + title rendering.
- Category items have a custom extension of the common item component that also displays links.
- The navigation target on item click is configurable:
  - On `/#/categories`, clicking an item goes to `/#/categories/:slug/items`.
  - On `/#/categories/:slug/items`, clicking an item goes to `/#/categories/:slug/items/:id`.

## Solution

- Extract a generic listing element shared by both pages.
- Extract a generic item element (picture + title) used inside the listing.
- Create a category-item specialisation of the item element that additionally renders links.
- Add a configurable `on-click` target/route to the item element so each page can provide its own navigation destination.

## Benefits

- Eliminates duplication between the two existing index pages.
- Provides a reusable base for future index pages with a similar layout.
- Makes navigation behaviour explicit and easy to change per page.

---
See issue for details: https://github.com/darthjee/oak/issues/142
