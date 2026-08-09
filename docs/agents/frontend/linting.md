# Linting and Inline Documentation

ESLint rules and the JSDoc conventions enforced on `frontend/assets/js/`.

ESLint (`frontend/eslint.config.mjs`) enforces:

- JSDoc for public classes/methods/functions in JS/JSX.
- React + React Hooks rules (`react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps`).
- Complexity/size constraints (`complexity`, `max-lines`, `max-depth`).
- Jasmine-specific exceptions under `spec/` (JSDoc requirements are disabled for test files).

All public classes, methods, and exported functions in `frontend/assets/js/` should include JSDoc comments.

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
