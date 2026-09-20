# Frontend Plan: Frontend: Kinds nav link

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Add the Kinds nav link to `HeaderHelper.jsx`

In `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx`:

- Add a `#renderKindsLink()` static method returning a single, always-visible `nav-item` — no dropdown, no submenu, no `logged` gating:
  ```jsx
  static #renderKindsLink() {
    return (
      <ul className='navbar-nav'>
        <li className='nav-item p-2'>
          <a className='nav-link' href='/#/kinds'>Kinds</a>
        </li>
      </ul>
    );
  }
  ```
- Add a `kindsLink` parameter to `#renderShell(categoriesMenu, kindsLink, authMenu, modal)`, rendering it inside the collapsible nav, immediately after `{categoriesMenu}` and before `{authMenu}`.
- Update all three call sites — `renderLoading()`, `renderError(error)`, and `render(logged, categories, handlers)` — to pass `this.#renderKindsLink()` as the new argument to `#renderShell` in the correct position.
- No changes needed to `HeaderController.js` or `Header.jsx` — `HeaderHelper.render(logged, categories, handlers)`'s public signature is unchanged; the link doesn't consume `categories`, `logged`, or `handlers`.

### Step 2 — Extend `HeaderHelper` Jasmine coverage

In `frontend/spec/components/elements/helpers/HeaderHelper_spec.js`, mirroring however the existing "Categories" dropdown assertions are structured, add one case per render state (`renderLoading`, `renderError`, `render`) confirming:

- A "Kinds" link with `href='/#/kinds'` is present in the rendered output.
- It renders identically regardless of the `logged` flag passed to `render()` (no gating).

## Files to Change

- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — add `#renderKindsLink()`, thread `kindsLink` through `#renderShell`, update the three call sites.
- `frontend/spec/components/elements/helpers/HeaderHelper_spec.js` — add coverage for the new link's presence/href across all three render states and both `logged` values.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Full implementation detail (markup, placement, rationale) already lives in `docs/agents/specs/kind/navigation.md` (from #272) — this plan just sequences applying it.
