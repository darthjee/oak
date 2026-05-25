# Plan: Add Inline Documentation for Frontend

## Overview

Add JSDoc comments to all frontend classes and methods in `frontend/assets/js/`, and configure `eslint-plugin-jsdoc` to enforce documentation presence on every public class, method, and function.

## Context

The React + Vite frontend (`frontend/`) has 19 `.js`/`.jsx` source files organized into components, controllers, and helpers. None of them currently have inline documentation. ESLint is already set up (`eslint.config.mjs`) and runs in CI via the `frontend-checks` job (`npm run lint`). Adding `eslint-plugin-jsdoc` will make documentation gaps a lint error, keeping the codebase self-documenting as it grows.

---

## Implementation Steps

### Step 1 — Install `eslint-plugin-jsdoc`

Add `eslint-plugin-jsdoc` as a devDependency in `frontend/package.json`.

```bash
docker-compose exec oak_fe npm install --save-dev eslint-plugin-jsdoc
```

### Step 2 — Configure ESLint

Update `frontend/eslint.config.mjs` to import and enable `eslint-plugin-jsdoc` with the following rules on source files (excluding `spec/`):

| Rule | Level | Notes |
|------|-------|-------|
| `jsdoc/require-jsdoc` | `error` | Require JSDoc on every class, public method, and exported function |
| `jsdoc/require-param` | `error` | Require `@param` for each parameter |
| `jsdoc/require-param-description` | `error` | Require description for each `@param` |
| `jsdoc/require-returns` | `error` | Require `@returns` when a function returns a value |
| `jsdoc/require-returns-description` | `error` | Require description for `@returns` |
| `jsdoc/require-description` | `error` | Require a prose description at the top of each block |

Spec files (`spec/**`) are excluded from all jsdoc rules.

Configuration context in `eslint.config.mjs`:

```js
import jsdoc from 'eslint-plugin-jsdoc';

// In the main config block:
plugins: { ..., jsdoc },
rules: {
  ...,
  'jsdoc/require-jsdoc': ['error', {
    require: { ClassDeclaration: true, MethodDefinition: true, FunctionDeclaration: true },
  }],
  'jsdoc/require-param': 'error',
  'jsdoc/require-param-description': 'error',
  'jsdoc/require-returns': 'error',
  'jsdoc/require-returns-description': 'error',
  'jsdoc/require-description': 'error',
}
```

### Step 3 — Add JSDoc Comments to All Source Files

Add JSDoc blocks to all 19 `.js`/`.jsx` files under `frontend/assets/js/`. Files to update:

**Components (`.jsx`)**
- `main.jsx`
- `components/App.jsx`
- `components/elements/Header.jsx`
- `components/elements/PageLink.jsx`
- `components/elements/Pagination.jsx`
- `components/pages/Categories.jsx`

**Controllers (`.js`)**
- `components/AppController.js`
- `components/elements/Header.js` (re-export proxy)
- `components/elements/controllers/HeaderController.js`
- `components/elements/controllers/HeaderController.jsx` (re-export proxy)
- `components/elements/controllers/HeaderClient.js`
- `components/elements/controllers/PaginationBuilder.js`
- `components/elements/controllers/PaginationController.js`
- `components/pages/controllers/CategoriesController.js`

**Helpers (`.jsx`/`.js`)**
- `components/helpers/AppHelper.jsx`
- `components/elements/helpers/PaginationHelper.jsx`
- `components/elements/helpers/HeaderHelper.js`
- `components/elements/helpers/HeaderHelper.jsx` (re-export proxy)
- `components/pages/helpers/CategoriesHelper.jsx`

Each class gets a class-level JSDoc. Each method/function gets a JSDoc with `@param` and `@returns` where applicable. Re-export proxy files (e.g. `HeaderController.jsx` that just re-exports from `.js`) need only a brief file-level or export-level comment.

### Step 4 — Update `docs/agents/frontend.md`

Add a **Inline Documentation** section to `docs/agents/frontend.md` covering:
- The JSDoc convention used (class-level doc, `@param`, `@returns`, description)
- That `eslint-plugin-jsdoc` enforces it via `npm run lint`
- A minimal example showing how to document a controller method

### Step 5 — Verify Lint Passes

Run lint inside the container and confirm no errors:

```bash
docker-compose exec oak_fe npm run lint
```

---

## Files to Change

- `frontend/package.json` — add `eslint-plugin-jsdoc` devDependency
- `frontend/eslint.config.mjs` — import plugin and add jsdoc rules
- All 19 `.js`/`.jsx` files under `frontend/assets/js/` — add JSDoc comments
- `docs/agents/frontend.md` — document the JSDoc convention and the jsdoc lint rule so future contributors know how to document new files

## CI Checks

Before opening a PR, run the following check for the `frontend/` folder:

- `frontend/`: `docker-compose exec oak_fe npm run lint` (CircleCI job: `frontend-checks`)

## Notes

- Private class fields (`#method`) in JS are not required to have JSDoc by default in `eslint-plugin-jsdoc`; the rule can be configured with `checkPrivate: false` to keep private method docs optional. Consider starting with private methods documented but not enforced, and revisiting if it becomes noisy.
- Re-export proxy files (e.g. a `.jsx` that just does `export { default } from './Foo.js'`) may need a `/* eslint-disable jsdoc/require-jsdoc */` exemption or a minimal file-level comment — decide during implementation.
- `eslint-plugin-jsdoc` version should be compatible with ESLint v9 (flat config) — verify the latest version supports flat config before installing.
