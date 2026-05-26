# Front-End Architecture

The Oak front-end is a React + Vite SPA located in `frontend/`. It runs in its own Docker container (`oak_fe`) and is served by the tent proxy.

Reference implementations: `../navi/frontend/src/components/` (component pattern) and `../weave/frontend/` (build/tooling setup).

---

## Running Locally

```bash
# Start everything (proxy + Rails + Vite dev server)
docker-compose up

# Front-end only
docker-compose up oak_fe
```

The Vite dev server runs on port 8080 inside the container, exposed at `http://localhost:3020`. When `FRONTEND_DEV_MODE=true` in `.env`, the tent proxy (port 3000) forwards all front-end requests to it with HMR enabled.

---

## Building for Production

```bash
docker-compose exec oak_fe npm run build
```

Output lands in `docker_volumes/static/`, which tent mounts and serves directly.

---

## Tests and Lint

```bash
# Tests (Jasmine)
docker-compose exec oak_fe npm test

# Lint (ESLint)
docker-compose exec oak_fe npm run lint

# Lint with auto-fix
docker-compose exec oak_fe npm run lint_fix
```

---

## Directory Structure

```
frontend/
  assets/
    css/
      styles.css        # custom CSS
      main.scss         # custom SCSS
    js/
      components/
        elements/       # reusable UI building blocks
          controllers/  # logic for elements
          helpers/      # JSX factories for elements
        pages/          # top-level route components
          controllers/  # logic for pages
          helpers/      # JSX factories for pages
      main.jsx          # entry point
  spec/                 # Jasmine tests (mirror src structure)
  index.html
  package.json
  vite.config.js
  eslint.config.mjs
```

---

## Component Architecture

Every non-trivial component is split into three layers. The pattern is borrowed from `../navi/frontend/src/components/`.

### Component (`.jsx`)

The React component itself. Responsible for:

- Declaring state with `useState`
- Wiring effects with `useEffect`, delegating to the controller
- Delegating all rendering to the helper

The component stays lean — no business logic, no inline JSX beyond the top-level conditional.

```jsx
// pages/Categories.jsx
function Categories() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const controller = new CategoriesController(setCategories, setError, setLoading);

  useEffect(controller.buildEffect(), []);

  if (loading) return CategoriesHelper.renderLoading();
  if (error)   return CategoriesHelper.renderError(error);

  return CategoriesHelper.render(categories);
}
```

### Controller (`.jsx` in `controllers/`)

A plain JS class. Responsible for:

- Data fetching (calling the API client)
- Event handlers (form submit, navigation, filter changes)
- Building `useEffect` callbacks
- All side-effect logic

No JSX. Receives state setters in the constructor.

```jsx
// pages/controllers/CategoriesController.jsx
class CategoriesController {
  constructor(setCategories, setError, setLoading) { ... }

  buildEffect() {
    return () => {
      fetchCategories()
        .then(data => this.#setCategories(data))
        .catch(err => this.#setError(err.message))
        .finally(() => this.#setLoading(false));
    };
  }
}
```

### Helper (`.jsx` in `helpers/`)

A static class. Responsible for:

- Returning JSX for every visual state (loading, error, success, empty)
- Composing sub-elements into the final rendered output

All methods are `static renderXxx()` returning JSX. No state, no side effects.

```jsx
// pages/helpers/CategoriesHelper.jsx
class CategoriesHelper {
  static renderLoading() { return <LoadingSpinner />; }
  static renderError(error) { return <ErrorAlert error={error} />; }
  static render(categories) { return <CategoriesList categories={categories} />; }
}
```

---

## Pages vs Elements

| Type | Location | Purpose |
|------|----------|---------|
| **Page** | `components/pages/` | Top-level route component. One per route (index, show, new, edit). Has its own controller and helper sub-folders. |
| **Element** | `components/elements/` | Reusable UI building block used across multiple pages (e.g., `Pagination`, `ErrorAlert`, `LoadingSpinner`). Also has controller/helper sub-folders when non-trivial. |

---

## Adding a New Page

1. Create `components/pages/MyPage.jsx` — state + wiring only.
2. Create `components/pages/controllers/MyPageController.jsx` — all logic.
3. Create `components/pages/helpers/MyPageHelper.jsx` — all JSX factories.
4. Register the route in `App.jsx`.

## Adding a New Element

1. Create `components/elements/MyElement.jsx`.
2. If it has logic: add `components/elements/controllers/MyElementController.jsx`.
3. If it has complex rendering: add `components/elements/helpers/MyElementHelper.jsx`.

---

## Docker Setup

Two images are used (see `dockerfiles/`):

| Image | Purpose |
|-------|---------|
| `vite_oak-base` | Published base image. Installs system deps, yarn cache, `deploy_frontend.sh`. Used in CI for builds. Default CMD: `npm run server`. |
| `vite_oak` | Local dev image. Pre-warms yarn cache at build time so `docker-compose up` starts fast. |

The `oak_fe` container mounts:

- `./frontend` → source code (watched by Vite for HMR)
- `./docker_volumes/node_modules` → persisted node_modules cache
- `./docker_volumes/static` → Vite build output, shared with `oak_proxy`

---

## Proxy Modes

Controlled by `FRONTEND_DEV_MODE` in `.env`:

| Mode | Behaviour |
|------|-----------|
| `FRONTEND_DEV_MODE=true` | Tent proxies all front-end requests to the Vite dev server. HMR works. No caching. |
| `FRONTEND_DEV_MODE=false` | Tent serves pre-built static files from `docker_volumes/static/`. |

---

## Inline Documentation

All public classes, methods, and exported functions in `frontend/assets/js/` must have JSDoc comments. ESLint enforces this via `eslint-plugin-jsdoc` (rules run as part of `npm run lint`).

### Convention

Every JSDoc block must include:

- A prose **description** as the first line of the block.
- `@param {type} name description` for each parameter.
- `@returns {type} description` for every function that returns a value.

### Example

```js
/**
 * Controls page routing based on the URL hash.
 */
export default class AppController {
  /**
   * Returns the page identifier matching the current URL hash.
   *
   * @returns {string} page identifier, e.g. `'categories'` or `'home'`
   */
  getPage() { ... }

  /**
   * Renders the component for the given page identifier.
   *
   * @param {string} page page identifier to render
   * @returns {JSX.Element} rendered page element
   */
  renderPage(page) { ... }
}
```

Private class fields (`#method`) are documented but not enforced by the linter — the rule is configured with `publicOnly: true`.

Re-export proxy files (e.g. `Header.jsx` that simply re-exports from `Header.js`) carry a brief one-line block comment describing the re-export purpose.
