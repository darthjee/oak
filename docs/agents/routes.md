# Routes

Routes fall into two categories: **resource routes** that are full SPA pages (redirect + `?ajax=true` template + `.json` data), and **utility routes** that are pure API endpoints called by AngularJS in the background (no template, no redirect).

---

## Resource Routes

These routes participate in the full SPA flow. An HTML GET request redirects to `/#/<path>`; AngularJS then fetches `/<path>?ajax=true` for the template and `/<path>.json` for the data.

All resource controllers include `OnePageApplication` (directly or via `UserRequired`).

### Home

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| GET | `/` | `home#show` | Renders the SPA shell — the only route that returns the full layout with all JS/CSS assets. |

### Categories

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| GET | `/categories` | `index_categories#index` | Paginated list of all categories (filtered by user subscriptions when applicable). |
| GET | `/categories/new` | `categories#new` | New category form. |
| POST | `/categories` | `categories#create` | Creates a new category. |
| GET | `/categories/:slug` | `categories#show` | Category detail page. |
| GET | `/categories/:slug/edit` | `categories#edit` | Edit category form. |
| PATCH/PUT | `/categories/:slug` | `categories#update` | Updates a category. |

### Items

Items are always nested under a category.

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| GET | `/categories/:category_slug/items` | `items#index` | Paginated list of items in the category. |
| GET | `/categories/:category_slug/items/new` | `items#new` | New item form. |
| POST | `/categories/:category_slug/items` | `items#create` | Creates a new item. |
| GET | `/categories/:category_slug/items/:id` | `items#show` | Item detail page. |
| GET | `/categories/:category_slug/items/:id/edit` | `items#edit` | Edit item form. |
| PATCH/PUT | `/categories/:category_slug/items/:id` | `items#update` | Updates an item. |

### Kinds

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| GET | `/kinds` | `kinds#index` | Paginated list of all kinds. |
| GET | `/kinds/new` | `kinds#new` | New kind form. |
| POST | `/kinds` | `kinds#create` | Creates a new kind. |
| GET | `/kinds/:slug` | `kinds#show` | Kind detail page. |

### Admin — Users

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

### Static Pages

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| GET | `/forbidden` | `static#forbidden` | Forbidden page. Has a template but no JSON data. Redirected to by `UserRequired` when a non-logged user tries to access a protected action. |

---

## Utility Routes

These routes are **API-only**: they return JSON (or perform an action) and have no `?ajax=true` template. They are called directly by AngularJS — never navigated to as pages.

### Session

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| POST | `/users/login` | `login#create` | Authenticates the user with `login` + `password` params. Returns the session as JSON. |
| GET | `/users/login` | `login#check` | Returns the current session as JSON. Used to check whether the user is still logged in. |
| DELETE | `/users/logoff` | `login#logoff` | Destroys the current session. |

### User Navigation Data

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| GET | `/user/categories` | `user/categories#index` | Returns the list of categories the logged user is subscribed to. Loaded on **every page** to build the category menu in the header. Returns all categories for anonymous users. |

### Form Support

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| GET | `/categories/:category_slug/kinds` | `category/kinds#index` | Returns the kinds associated with a category as JSON. Used to populate the kind `ng_select` dropdown in the item form. |

### Subscriptions

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| POST | `/categories/:category_slug/subscriptions` | `subscriptions#create` | Subscribes the logged user to a category. Idempotent — returns `200 OK` if already subscribed, `201 Created` if newly subscribed. |

---

## Disabled / Pending Cleanup

| Path | Notes |
|------|-------|
| `GET /users` | Should be disabled. User management is handled by `/admin/users`. Pending removal. |
