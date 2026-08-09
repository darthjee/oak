# Front-End

The Oak front-end is a React + Vite SPA located in `frontend/`. It runs in its own Docker container (`oak_fe`) and is served through the Tent proxy. This page orients you in the directory layout and the Page/Element split; see the linked pages for the component pattern, dev workflow, and linting rules.

Reference implementations: `../navi/frontend/src/components/` (component pattern) and `../weave/frontend/` (build/tooling setup).

- [Component Pattern](component-pattern.md) — Component/Controller/Helper architecture, adding a new page or element, routing utilities.
- [Dev Workflow](dev-workflow.md) — running locally, building for production, tests/lint, Docker setup, proxy modes.
- [Linting](linting.md) — ESLint rules and JSDoc conventions.
- [Examples](examples.md) — component/controller/helper code snippets.

---

## Runtime Boot Flow

The SPA boot sequence is:

1. `frontend/index.html` defines `<div id="root"></div>` and loads `/assets/js/main.jsx`.
2. `frontend/assets/js/main.jsx` imports Bootstrap CSS/JS plus local CSS/SCSS, creates a `QueryClient`, and mounts `<App />` inside `QueryClientProvider`.
3. `frontend/assets/js/components/App.jsx` uses `AppController` to resolve the current hash route and render the matching page.

---

## Directory Structure

```
frontend/
  assets/
    css/
      styles.css        # custom CSS
      main.scss         # custom SCSS
    js/
      client/           # HTTP API clients
      components/
        App.jsx           # app shell (exception: lives at components root)
        AppController.js  # app shell controller (exception: lives at components root)
        elements/       # reusable UI building blocks
          controllers/  # logic for elements (.js)
          helpers/      # JSX factories for elements (.jsx)
        helpers/        # JSX helpers shared by pages and elements (.jsx)
        pages/          # top-level route components
          controllers/  # logic for pages (.js)
          helpers/      # JSX factories for pages (.jsx)
      utils/            # non-JSX utility classes and functions (.js)
      main.jsx          # entry point
  spec/                 # Jasmine tests (mirror src structure)
  index.html
  package.json
  vite.config.js
  eslint.config.mjs
```

---

## Pages vs Elements

| Type | Location | Purpose |
|------|----------|---------|
| **Page** | `components/pages/` | Top-level route component. One per route (index, show, new, edit). Has its own controller and helper sub-folders. |
| **Element** | `components/elements/` | Reusable UI building block used across multiple pages (e.g., `Pagination`, `ErrorAlert`, `LoadingSpinner`). Also has controller/helper sub-folders when non-trivial. |
