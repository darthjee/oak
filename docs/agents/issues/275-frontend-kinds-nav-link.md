# Issue: Frontend: Kinds nav link

## Description

Part of #271. The header nav (`Header.jsx`/`HeaderHelper.jsx`) currently only exposes navigation to Categories, rendered as a dropdown ("All" / "New" / one link per subscribed category). There is no way to reach the existing Kinds list page (`/#/kinds`) from the header nav. Kinds are not subscribed per-user, so they don't need a dropdown — just a single, always-visible link.

## Problem

Users cannot navigate to the Kinds list page from the header nav; it is only reachable via a direct URL, unlike Categories which is already surfaced in the header.

## Expected Behavior

- [ ] A "Kinds" nav link appears in the header, right after "Categories", for both logged-in and logged-out users.
- [ ] Clicking it navigates to `/#/kinds` (the existing Kinds list page).
- [ ] Jasmine tests updated/added for `HeaderHelper` covering the new link's presence and href.
- [ ] ESLint passes with no new offences.

## Solution

Follow the navigation spec written in `docs/agents/specs/kind/navigation.md` (from #272). Concretely, in `HeaderHelper.jsx`:

- Add a `#renderKindsLink()` static method rendering a plain, always-visible `nav-item` (`<a className='nav-link' href='/#/kinds'>Kinds</a>`) — no dropdown/submenu, no `logged` gating (unlike `#renderCategories`).
- Thread a `kindsLink` element through `#renderShell`, rendered immediately after `categoriesMenu` and before `authMenu`/`modal`.
- Update all three call sites (`renderLoading()`, `renderError()`, `render()`) to pass `#renderKindsLink()` into `#renderShell`.
- No changes needed to `HeaderController.js` or `Header.jsx` — the link is static and doesn't consume `categories`, `logged`, or `handlers`; `HeaderHelper.render(logged, categories, handlers)`'s signature is unchanged.
- Extend `HeaderHelper_spec.js` with one case per render state (`renderLoading`, `renderError`, `render`) confirming the "Kinds" link is present with `href='/#/kinds'`, rendering identically regardless of the `logged` flag.

## Benefits

Makes the existing Kinds list page discoverable from the header nav, consistent with how Categories is already surfaced, while keeping `HeaderController.js`/`Header.jsx` untouched since no new data flow is required.
