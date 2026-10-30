# Issue: Kinds: add "New kind" entry point and category selection on the kind form

## Description

Add a visible entry point for creating kinds and allow connecting a kind to categories directly from the kind new/edit form.

## Problem

- Kinds can already be created: the `/#/kinds/new` hash route is registered (`HashRouteResolver.js`) and wired to the `KindNew` page, backed by `KindsController#new`/`#create` (login required). However, nothing in the UI links to it, so the form is only reachable by typing the URL.
- A kind can only be connected to a category from the category side (`CategoryKindsEditor` on the category new/edit form, saved through `CategoriesController` with `kinds: [:slug]` and `Oak::Category::UpdateBuilder`). The kind form only has a `name` field (`KindsController#kind_params` permits only `:name`), and `Oak::Kind` has no association back to categories.

## Expected Behavior

- Logged-in users see a "New" button on the Kinds index page and a "New" item in a "Kinds" header dropdown, both linking to `/#/kinds/new`.
- The kind new and edit forms let the user select the categories the kind belongs to; saving the kind syncs its category links.

## Solution

### 1. "New kind" entry point (frontend)

- Add a "New" button on the Kinds index page (`KindsHelper`), shown only for logged-in users, mirroring `CategoriesHelper#renderNewButton` (links to `/#/kinds/new`).
- Turn the header "Kinds" item (today a plain link, `HeaderHelper#renderKindsLink`) into a dropdown with:
  - **New** → `/#/kinds/new`, shown only for logged-in users (same as the categories dropdown "New" item);
  - **All** → `/#/kinds`.
- Unlike the Categories dropdown, the Kinds dropdown does **not** list each kind: the header does not need to fetch kinds, and the menu stays short.

### 2. Category selection on the kind form

- Backend:
  - Add `has_many :category_kinds` / `has_many :categories, through: :category_kinds` to `Oak::Kind`.
  - Permit categories (`categories: [:slug]`) in `KindsController#kind_params`.
  - The kind's `new`/`edit` JSON exposes the currently linked categories; the form also needs the list of available categories to choose from.
- Frontend: add a categories editor to the kind new and edit forms, reusing or mirroring the `CategoryKindsEditor` pattern.

### Save behavior

- **Full sync**, mirroring the category side: the submitted `categories` list replaces the kind's category links. Categories no longer in the list are unlinked (their `category_kinds` destroyed) and new ones are linked, all in one transaction.
- Implement it with `Oak::Kind::CreateBuilder` / `Oak::Kind::UpdateBuilder` (wired through `build_with:` / `update_with:` in `KindsController`), mirroring `Oak::Category::CreateBuilder` / `UpdateBuilder`.
- **Missing key:** on update, if the request has no `categories` key at all, the kind's links are left untouched. Only an explicit `categories: []` unlinks every category. (This intentionally differs from `Oak::Category::UpdateBuilder`, where a missing `kinds` key defaults to `[]`.)

### Edge cases

- **Unlinking a category that still has items of this kind:** allowed. The link is removed and existing items keep their kind untouched (no new validation). This matches the category form's behavior today: `Oak::Item` does not validate that its kind is linked to its category.
- **Unknown category slugs:** ignored; they do not cause an error.
- **Explicit empty list:** `categories: []` must unlink every category and must stay distinct from a missing `categories` key. Rails strong params / JSON param handling can drop empty arrays, so a request spec must prove that `categories: []` reaches the builder and unlinks everything.

## Benefits

- Kind creation becomes discoverable from the UI instead of requiring a hand-typed URL.
- Kinds and categories can be linked from either side, without having to open each category's form.
