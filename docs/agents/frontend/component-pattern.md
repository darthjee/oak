# Component Pattern

The Component/Controller/Helper split every non-trivial React component follows, plus the routing utilities used to resolve hash routes. Code snippets referenced below live in [examples.md](examples.md).

## Component Architecture

Every non-trivial component is split into three layers. The pattern is borrowed from `../navi/frontend/src/components/`.

### Component (`.jsx`)

The React component itself. Responsible for:

- Declaring state with `useState`
- Wiring effects with `useEffect`, delegating to the controller
- Delegating all rendering to the helper

The component stays lean — no business logic, no inline JSX beyond the top-level conditional. See [examples.md](examples.md#component-jsx).

### Controller (`.js` in `controllers/`)

A plain JS class. Responsible for:

- Data fetching (calling the API client)
- Event handlers (form submit, navigation, filter changes)
- Building `useEffect` callbacks
- All side-effect logic

No JSX. Receives state setters in the constructor. See [examples.md](examples.md#controller-js-in-controllers).

### Helper (`.jsx` in `helpers/`)

A static class. Responsible for:

- Returning JSX for every visual state (loading, error, success, empty)
- Composing sub-elements into the final rendered output

All methods are `static renderXxx()` returning JSX. No state, no side effects. See [examples.md](examples.md#helper-jsx-in-helpers).

---

## Adding a New Page

1. Create `components/pages/MyPage.jsx` — state + wiring only.
2. Create `components/pages/controllers/MyPageController.js` — all logic.
3. Create `components/pages/helpers/MyPageHelper.jsx` — all JSX factories.
4. Register the route in `App.jsx`.

## Adding a New Element

1. Create `components/elements/MyElement.jsx`.
2. If it has logic: add `components/elements/controllers/MyElementController.js`.
3. If it has complex rendering: add `components/elements/helpers/MyElementHelper.jsx`.

---

## Routing Utilities

Routing helpers live under `frontend/assets/js/utils/`:

- `Router.register(path, page)` registers route patterns.
- `Router.resolve(route)` resolves a route path into a page key.
- `Router.extractParams(path, route)` extracts params for `:param` segments.
- `Route` compiles `:param` path segments into regex capture groups and exposes parsed params.

`HashRouteResolver` builds the known route table and resolves the current `window.location.hash`, stripping query strings before route matching.
