# Resource Routes

These routes participate in the SPA flow. An HTML GET request redirects to `/#/<path>`; the React frontend then fetches `/<path>.json` for data loading.

All resource controllers include `OnePageApplication` (directly or via `UserRequired`).

## Home

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| GET | `/` | `home#show` | Renders the SPA shell — the only route that returns the full layout with all JS/CSS assets. |

## Categories

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| GET | `/categories` | `index_categories#index` | Paginated list of all categories (filtered by user subscriptions when applicable). |
| GET | `/categories/new` | `categories#new` | New category form. |
| POST | `/categories` | `categories#create` | Creates a new category. |
| GET | `/categories/:slug` | `categories#show` | Category detail page. |
| GET | `/categories/:slug/edit` | `categories#edit` | Edit category form. |
| PATCH/PUT | `/categories/:slug` | `categories#update` | Updates a category. |

## Items

Items are always nested under a category.

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| GET | `/categories/:category_slug/items` | `items#index` | Paginated list of items in the category. |
| GET | `/categories/:category_slug/items/new` | `items#new` | New item form. |
| POST | `/categories/:category_slug/items` | `items#create` | Creates a new item. |
| GET | `/categories/:category_slug/items/:id` | `items#show` | Item detail page. |
| GET | `/categories/:category_slug/items/:id/edit` | `items#edit` | Edit item form. |
| PATCH/PUT | `/categories/:category_slug/items/:id` | `items#update` | Updates an item. |

## Kinds

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| GET | `/kinds` | `kinds#index` | Paginated list of all kinds. |
| GET | `/kinds/new` | `kinds#new` | New kind form. |
| POST | `/kinds` | `kinds#create` | Creates a new kind. |
| GET | `/kinds/:slug` | `kinds#show` | Kind detail page. |

## Admin — Users

Full user management, restricted to admins.

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| GET | `/admin/users` | `admin/users#index` | Paginated list of all users. |
| GET | `/admin/users/new` | `admin/users#new` | New user form. |
| POST | `/admin/users` | `admin/users#create` | Creates a new user. |
| GET | `/admin/users/:id` | `admin/users#show` | User detail page. |
| GET | `/admin/users/:id/edit` | `admin/users#edit` | Edit user form. |
| PATCH/PUT | `/admin/users/:id` | `admin/users#update` | Updates a user. |
| DELETE | `/admin/users/:id` | `admin/users#destroy` | Deletes a user. |

## Forbidden

`GET /forbidden` no longer exists as a Rails route — `static#forbidden` and its route were removed. `UserRequired` still redirects a non-logged user to the SPA hash target `/#/forbidden` when a protected action is accessed, but React has no page there yet (tracked in [#226](https://github.com/darthjee/oak/issues/226)).

## Authorizations

`#/authorizations` (route key `authorizations`, page `components/pages/Authorizations.jsx`) is an
SPA-only page with no Rails resource route behind it. It is reached through **Account →
Authorizations** in the header and is meant for logged-in users. It lists the user's pending
device-authorization requests through `POST /auth/authorization-requests/mine` (on mount and on
Refresh, no automatic polling) and authorizes (with the user's password) or denies each one. A
`401` from any call marks the user logged out and opens the login modal. Endpoints are listed under
[Device Authorization](utility-routes.md#device-authorization).
