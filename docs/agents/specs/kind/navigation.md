# Kind Pages — Navigation

[← Back to Kind Pages](../kind.md)

Concrete placement and behavior for #275's plain "Kinds" nav link — no
submenu, no login gating, unlike the "Categories" dropdown next to it.

## Placement

In `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx`'s
`#renderShell` (called from `renderLoading()`, `renderError()`, and
`render()`), add the new link as a sibling of the existing `#renderCategories(...)`
call, immediately after it, before the auth menu:

```jsx
static #renderShell(categoriesMenu, kindsLink, authMenu, modal) {
  return (
    <div className='flex-column align-items-center bg-light border-bottom shadow-sm'>
      <nav className='navbar navbar-expand-sm navbar-light bg-light'>
        <a className='navbar-brand' href='/#/'>Oak</a>
        {/* ...existing toggler button... */}
        <div className='collapse navbar-collapse' id='navbarSupportedContent'>
          {categoriesMenu}
          {kindsLink}
          {authMenu}
        </div>
      </nav>
      {modal}
    </div>
  );
}
```

Every call site of `#renderShell` (`renderLoading()`, `renderError()`,
`render()`) passes a `#renderKindsLink()`-built element as the new
argument, the same way each already passes `#renderCategories(...)`.

## Link markup

A single, always-visible `nav-item` — no dropdown, no submenu (unlike
`#renderCategories`'s `dropdown`/`dropdown-menu` structure), and no
`logged` conditional (unlike `#renderCategories`'s `logged`-gated "New"
entry):

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

## `HeaderController.js` — no changes needed

The link is static (a plain href, no data-driven submenu), so no new
data-fetching, state, or props flow through `HeaderController.js` or
`Header.jsx` — `HeaderHelper.render(logged, categories, handlers)`'s
existing signature is unchanged; the new link simply doesn't consume
`categories`, `logged`, or `handlers`.

## Test-coverage expectations

Extend the existing `HeaderHelper` spec coverage (mirroring however the
"Categories" dropdown is already asserted) with one case per render state
(`renderLoading`, `renderError`, `render`) confirming the "Kinds" link is
present with `href='/#/kinds'`, and that it renders identically regardless
of the `logged` flag passed to `render()`.
