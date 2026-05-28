# Plan: Add Edit Category Item Page

## Overview

Add a React edit page for category items at `/#/categories/:slug/items/:id/edit`, following the existing component/controller/helper pattern. Extract the shared info-card structure into a reusable element so both the show and edit pages share the same visual shell. Add a `patch()` method to `GenericClient` to support PATCH submissions. Wire the new route in `HashRouteResolver` and `AppHelper`.

## Context

- The show page (`CategoryItem`) is fully implemented in React with the component/controller/helper split.
- `CategoryItemHelper.#renderInfo()` renders a Bootstrap card with the item name in the header and field rows in the body — this card wrapper is the primary shared structure.
- `CategoryItemHelper` already renders an **Edit** button (visible when logged in) that links to `/#/categories/:slug/items/:id/edit`. The link is live but the route is unregistered and falls back to `home`.
- `GenericClient` only has `fetch()` (GET) and `fetchIndex()` (paginated GET); no PATCH method exists yet.
- `HashRouteResolver` must match the edit URL **before** the show URL because the show regex (`[^/]+`) would otherwise greedily match `123/edit` as the item id — wait, actually `[^/]+` stops at `/`, so `#/categories/foo/items/123/edit` does NOT match the show pattern. The edit pattern still needs to be added explicitly.

## Implementation Steps

### Step 1 — Add `patch()` to `GenericClient`

Add a `patch(path, body)` method to `GenericClient` that sends a `PATCH` request with a JSON body and returns the parsed JSON response.

File: `frontend/assets/js/client/GenericClient.js`

### Step 2 — Register the `categoryItemEdit` route

Update `HashRouteResolver.getPage()` to recognise `#/categories/:slug/items/:id/edit` and return `'categoryItemEdit'`. Add the regex **before** the existing `categoryItem` pattern so the more-specific path is tested first.

File: `frontend/assets/js/utils/HashRouteResolver.js`

### Step 3 — Extract `CategoryItemInfoCard` element

Create a new element `CategoryItemInfoCard` that renders the Bootstrap card wrapper: the card header (item name) and a card body that accepts `children`. This replaces the inline card markup in `CategoryItemHelper.#renderInfo()`.

- **New file**: `frontend/assets/js/components/elements/CategoryItemInfoCard.jsx`
- **Update**: `frontend/assets/js/components/pages/helpers/CategoryItemHelper.jsx` — use `CategoryItemInfoCard` in `#renderInfo()`

Both the show and edit helpers will use this element, ensuring a consistent look.

### Step 4 — Create `CategoryItemLinksEditor` element

Create a stateless element `CategoryItemLinksEditor` that renders an editable list of links (text + URL inputs, Delete button per link, Add Link button at the bottom). State and callbacks are passed in from the parent controller.

- **New file**: `frontend/assets/js/components/elements/CategoryItemLinksEditor.jsx`

Props: `links` (array), `onLinkChange(index, field, value)`, `onRemoveLink(index)`, `onAddLink()`.

### Step 5 — Create `CategoryItemEdit` page

Following the component/controller/helper pattern:

#### `CategoryItemEditController`

- Extracts `slug` and `id` from the hash — the edit URL has a `/edit` suffix, so a new `getCategoryItemEditParamsFromHash()` extractor is needed (similar to the existing one for show).
- On mount: fetches item data and the available kinds list in parallel:
  - `GET /categories/:slug/items/:id.json` — item data
  - `GET /categories/:slug/kinds.json` — list of `{ name, slug }` objects (via `Oak::Kind::SelectDecorator`)
- Manages form state for editable fields: `name`, `description`, `kind_slug`, `links` (array).
- Provides link management callbacks: `addLink()`, `removeLink(index)`, `updateLink(index, field, value)`.
- On save: sends `PATCH /categories/:slug/items/:id.json` with the current form state, then navigates to `/#/categories/:slug/items/:id`.

Files:
- **New**: `frontend/assets/js/components/pages/controllers/CategoryItemEditController.js`

#### `CategoryItemEditHelper`

- Renders loading / error states (same as show).
- Renders the edit form using `CategoryItemInfoCard` (card shell) with:
  - `LabeledInput` for `name` and `description`.
  - A `<select>` for `kind_slug`, populated from the `kinds` list (`[{ name, slug }]`); uses `slug` as the option value and `name` as the display label.
- Renders `CategoryItemLinksEditor` for link management.
- Renders an actions bar with a Back link and a Save button.

File:
- **New**: `frontend/assets/js/components/pages/helpers/CategoryItemEditHelper.jsx`

#### `CategoryItemEdit` (page component)

- State: `item`, `kinds`, `loading`, `error`, `saving`.
- Wires controller and delegates rendering to helper.

File:
- **New**: `frontend/assets/js/components/pages/CategoryItemEdit.jsx`

### Step 6 — Register the new page in `AppHelper`

Add `categoryItemEdit: <CategoryItemEdit />` to the `PAGES` map.

File: `frontend/assets/js/components/helpers/AppHelper.jsx`

### Step 7 — Write tests

Mirror the source tree under `frontend/spec/`:

- `spec/client/GenericClient_spec.js` — add tests for `patch()`
- `spec/utils/HashRouteResolver_spec.js` — add tests for the `categoryItemEdit` route
- `spec/components/elements/CategoryItemInfoCard_spec.js` — new
- `spec/components/elements/CategoryItemLinksEditor_spec.js` — new
- `spec/components/pages/CategoryItemEdit_spec.js` — new
- `spec/components/pages/controllers/CategoryItemEditController_spec.js` — new
- `spec/components/pages/helpers/CategoryItemEditHelper_spec.js` — new
- `spec/components/helpers/AppHelper_spec.js` — add `categoryItemEdit` entry
- `spec/components/pages/helpers/CategoryItemHelper_spec.js` — update for `CategoryItemInfoCard` usage

## Files to Change

| File | Change |
|------|--------|
| `frontend/assets/js/client/GenericClient.js` | Add `patch()` method |
| `frontend/assets/js/utils/HashRouteResolver.js` | Add `categoryItemEdit` route regex |
| `frontend/assets/js/components/helpers/AppHelper.jsx` | Register `categoryItemEdit` page |
| `frontend/assets/js/components/elements/CategoryItemInfoCard.jsx` | **New** — shared card wrapper |
| `frontend/assets/js/components/elements/CategoryItemLinksEditor.jsx` | **New** — editable links list |
| `frontend/assets/js/components/pages/CategoryItemEdit.jsx` | **New** — edit page component |
| `frontend/assets/js/components/pages/controllers/CategoryItemEditController.js` | **New** — edit controller |
| `frontend/assets/js/components/pages/helpers/CategoryItemEditHelper.jsx` | **New** — edit helper |
| `frontend/assets/js/components/pages/helpers/CategoryItemHelper.jsx` | Use `CategoryItemInfoCard` |
| `frontend/spec/client/GenericClient_spec.js` | Add `patch()` tests |
| `frontend/spec/utils/HashRouteResolver_spec.js` | Add `categoryItemEdit` tests |
| `frontend/spec/components/helpers/AppHelper_spec.js` | Add `categoryItemEdit` entry |
| `frontend/spec/components/elements/CategoryItemInfoCard_spec.js` | **New** |
| `frontend/spec/components/elements/CategoryItemLinksEditor_spec.js` | **New** |
| `frontend/spec/components/pages/CategoryItemEdit_spec.js` | **New** |
| `frontend/spec/components/pages/controllers/CategoryItemEditController_spec.js` | **New** |
| `frontend/spec/components/pages/helpers/CategoryItemEditHelper_spec.js` | **New** |
| `frontend/spec/components/pages/helpers/CategoryItemHelper_spec.js` | Update for extracted element |

## Notes

- `kind` is editable via a `<select>` populated from `GET /categories/:slug/kinds.json`, which returns `[{ name, slug }]` (via `Oak::Kind::SelectDecorator`). The form submits the selected `slug` as `kind_slug`.
- `category` is read-only on the edit page (category is fixed once an item is created).
- The `visible` checkbox visible in the Rails edit form (`_form_data.html.erb`) is not shown in the current show page. Whether to include it in the React edit form is an open question.
- `PATCH` response handling: if the server returns validation errors, the controller should surface them. The current scope only handles network-level errors; field-level error display can be added as a follow-up.
- No CI section yet — to be added after confirming which CircleCI jobs cover `frontend/`.

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `frontend/`: `docker-compose exec oak_fe npm test` (Jasmine)
- `frontend/`: `docker-compose exec oak_fe npm run lint` (ESLint)
