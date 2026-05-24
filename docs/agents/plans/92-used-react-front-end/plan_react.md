# React Application Plan

Step 6 of [plan.md](plan.md). Implement the React + Vite SPA to replace the current AngularJS frontend, matching the existing look and navigation.

---

## Overview

The React app calls the existing Rails JSON API endpoints (no backend changes needed). React Router handles client-side navigation with browser history (clean URLs like `/categories`, not AngularJS's `#/categories`). The tent catch-all rule for `/` → `index.html` handles direct URL access and refreshes.

---

## Application Structure

```
frontend/
  assets/          # static assets (images, fonts)
  spec/            # Jasmine unit tests
  src/
    main.jsx       # entry point — mounts <App />
    App.jsx        # router setup
    api/           # react-query hooks per resource
    components/    # shared UI components (layout, nav, pagination, forms)
    pages/         # one folder per resource
      categories/
      items/
      kinds/
      links/
      photos/
      subscriptions/
```

---

## Implementation Steps

### Step 6.1 — App shell and routing

- `src/main.jsx` — render `<App />` inside `<QueryClientProvider>` and `<BrowserRouter>`
- `src/App.jsx` — define routes with `react-router-dom`, one per resource action
- Layout component with navbar and Bootstrap container wrapper (matching the current Rails layout)

### Step 6.2 — API layer

Create `src/api/` hooks using `@tanstack/react-query`:

- One file per resource (e.g., `src/api/categories.js`)
- `useList`, `useShow`, `useCreate`, `useUpdate`, `useDelete` hooks calling the Rails JSON endpoints
- Base fetch utility that handles CSRF tokens (required for POST/PUT/DELETE to Rails)

### Step 6.3 — Implement pages per resource

For each resource, create four page components mirroring the current AngularJS views:

| Page | Rails endpoint | React route |
|------|---------------|-------------|
| Index | `/categories.json` | `/categories` |
| Show | `/categories/:id.json` | `/categories/:id` |
| New | POST `/categories.json` | `/categories/new` |
| Edit | PUT `/categories/:id.json` | `/categories/:id/edit` |

Resources to implement (in suggested order):
1. **Categories** — simplest resource, good starting point
2. **Kinds** — similar structure to categories
3. **Items** — main resource, has relations to category and kind
4. **Links** — nested under items
5. **Photos** — nested under items, has file upload
6. **Subscriptions** — user-facing

### Step 6.4 — Shared components

Extract reusable UI pieces:
- `Pagination` component (replacing the AngularJS `ng-pagination` element)
- `FormField`, `SelectField`, `TextAreaField` wrappers (replacing Magicka form elements)
- `ErrorList` for displaying validation errors from the Rails API
- `NavBar` matching the current Bootstrap navigation

---

## Notes

- The Rails JSON API is unchanged — decorators already expose the fields needed.
- CSRF protection: Rails uses `protect_from_forgery`. React must read the `X-CSRF-Token` from the `<meta name="csrf-token">` tag (or via a cookie) and send it with non-GET requests.
- React Router uses browser history; tent's proxy rule for `/` → `index.html` ensures that direct URL access and page refreshes work correctly.
- Each resource should be a separate sub-issue to keep PRs manageable.
