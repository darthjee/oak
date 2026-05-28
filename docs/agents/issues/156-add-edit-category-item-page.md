# Issue: Add Edit Category Item Page

## Description

Add an edit page for category items, accessible at `/#/categories/:slug/items/:id/edit`. The page should mirror the view page layout but replace read-only fields with editable inputs and provide link management controls.

## Problem

- There is no way to edit an existing category item through the frontend.
- Users have no UI to update item fields or manage links after creation.

## Expected Behavior

- A new edit page is available at `/#/categories/:slug/items/:id/edit`.
- The page renders similarly to the view page (`/#/categories/:slug/items/:id`) with the following differences:
  - The image carousel is **not** rendered.
  - Each field shows a text input for the value instead of a read-only label+value pair.
  - The links section renders a list of link forms (reusing `app/views/items/_form_links.html.erb` as reference) with:
    - A text input for link text and a text input for link URL per link.
    - A "Remove" button for each existing link.
    - An "Add link" button to append a new blank link form.
- Submitting the form sends a `PATCH` request to the items API endpoint for the given category and item.
- After a successful save, the user is redirected to the view page `/#/categories/:slug/items/:id`.
- The view page (`/#/categories/:slug/items/:id`) has an **Edit** button that is only visible when the user is logged in.

## Solution

- Extract shared components/partials between the show and edit pages so the common layout and feel are maintained in a single place.
- Create the Angular route `#/categories/:slug/items/:id/edit` pointing to an edit template.
- Build the edit template reusing the extracted shared components, removing the carousel and replacing display elements with form inputs.
- Implement link management in the template: render existing links as editable rows, support removal and addition.
- Wire the form submission to `PATCH /categories/:slug/items/:id` and handle the redirect on success.
- Add a conditional "Edit" button to the view template, shown only when the user session is active.

## Benefits

- Users can update item information and manage links directly from the frontend without backend access.
- Keeps the edit experience consistent with the existing view layout.

---
See issue for details: https://github.com/darthjee/oak/issues/156
