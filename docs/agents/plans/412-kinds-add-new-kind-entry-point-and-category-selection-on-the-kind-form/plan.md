# Plan: Kinds: add "New kind" entry point and category selection on the kind form

Issue: [412-kinds-add-new-kind-entry-point-and-category-selection-on-the-kind-form.md](../../issues/412-kinds-add-new-kind-entry-point-and-category-selection-on-the-kind-form.md)

## Overview

Make kind creation reachable from the UI (a "New" button on the Kinds index page and a "Kinds" header dropdown with New/All), and let the kind new/edit forms select the categories a kind belongs to. The backend gains a `Kind -> categories` association, a form decorator exposing linked categories, and create/update builders that fully sync `category_kinds` (mirroring the category side, except that a missing `categories` key leaves links untouched). The frontend adds a categories editor to the kind form and sends the selected categories on save.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

### Kind form JSON (read)

`GET /kinds/new.json`, `GET /kinds/:slug.json` (also used by the edit page), and the responses of `POST /kinds.json` / `PATCH /kinds/:slug.json` render the kind through `Oak::Kind::FormDecorator`:

```json
{
  "name": "Board Games",
  "slug": "board-games",
  "snap_url": "/assets/images/kind.png",
  "categories": [
    { "name": "Games", "slug": "games" }
  ]
}
```

- `categories` is always an array (`[]` for a new kind or a kind with no links), each entry `{ name: string, slug: string }`.

### Kind save payload (write)

`POST /kinds.json` and `PATCH /kinds/:slug.json`:

```json
{ "kind": { "name": "Board Games", "categories": [{ "slug": "games" }] } }
```

- The frontend form **always** sends `categories` (possibly `[]`).
- Backend semantics: full sync of the kind's category links. `categories: []` unlinks all; a request with **no** `categories` key leaves links untouched (update). Unknown slugs are ignored.

### Available categories (options for the select)

The frontend loads the selectable categories from the existing endpoint `GET /categories.json?filters[include_empty]=true` (`IndexCategoriesController`, returns an array of `{ name, slug, snap_url }`). No backend change is needed for it. Like the category form's kinds select (`/kinds.json`), it only returns the first page (20 entries); this limitation is accepted for now.
