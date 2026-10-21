# Account dropdown and mode prop
Replace the logged-in branch of `HeaderHelper#renderAuth` with an **Account** dropdown, using the
same Bootstrap markup as `#renderCategories` (`ul.navbar-nav.dropdown` > `li.nav-item` >
`a.nav-link.dropdown-toggle` + `div.dropdown-menu`). Entries, in order:

1. **Authorizations** — `a.dropdown-item` with `href='/#/authorizations'`.
2. **Logoff** — `a.dropdown-item` with `href=''` and `onClick={handlers.onLogoff}`.

Remove the standalone navbar Logoff link. The logged-out branch (Login link) is unchanged apart
from calling `handlers.onLoginClick` as today.

`#renderLoginModal` passes `mode={handlers.modalMode || 'password'}` to `LoginModal`. Update the
`render` JSDoc `handlers` type. `LoginModal` itself is not changed (it ignores `mode` until #397).

Specs (`HeaderHelper_spec`): logged in renders "Account" with Authorizations then Logoff, the
Authorizations href, Logoff calling `onLogoff`, and no Login link; logged out renders Login and no
Account dropdown; `LoginModal` receives `mode` (and defaults to `'password'`).

## Files to Change
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — Account dropdown, `mode` prop.
- `frontend/spec/components/elements/helpers/HeaderHelper_spec.js` — new expectations.
