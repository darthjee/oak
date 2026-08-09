# Utility Routes

These routes are **API-only**: they return JSON (or perform an action) and are called directly by frontend clients/controllers — never navigated to as pages.

## Session

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| POST | `/users/login` | `login#create` | Authenticates the user with `login` + `password` params. Returns the session as JSON. |
| GET | `/users/login` | `login#check` | Returns the current session as JSON. Used to check whether the user is still logged in. |
| DELETE | `/users/logoff` | `login#logoff` | Destroys the current session. |

## User Navigation Data

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| GET | `/user/categories` | `user/categories#index` | Returns the list of categories the logged user is subscribed to. Loaded on **every page** to build the category menu in the header. Returns all categories for anonymous users. |

## Form Support

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| GET | `/categories/:category_slug/kinds` | `category/kinds#index` | Returns the kinds associated with a category as JSON. Used to populate the kind `ng_select` dropdown in the item form. |

## Subscriptions

| Method | Path | Controller#Action | Description |
|--------|------|-------------------|-------------|
| POST | `/categories/:category_slug/subscriptions` | `subscriptions#create` | Subscribes the logged user to a category. Idempotent — returns `200 OK` if already subscribed, `201 Created` if newly subscribed. |

---

## Disabled / Pending Cleanup

| Path | Notes |
|------|-------|
| `GET /users` | Should be disabled. User management is handled by `/admin/users`. Pending removal. |
