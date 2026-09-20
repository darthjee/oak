# Routing and AppHelper wiring

Wire the three new pages (from steps 01–03) into the hash router and `AppHelper.jsx`'s page map, making `KindsHelper.jsx`'s existing `CatalogCard` links to `/#/kinds/${slug}` resolve instead of 404ing at the router level.

In `HashRouteResolver.js`'s `#buildRouter()`, add the new registrations immediately before the existing `router.register('/kinds', 'kinds')` line, in this exact order (more specific routes before the less specific `/kinds/:slug`, mirroring the existing categories-route ordering precisely — `edit`/`new` must be registered before the bare `:slug` route or the wildcard would swallow them):

```js
router.register('/kinds/:slug/edit', 'kindEdit');
router.register('/kinds/new', 'kindNew');
router.register('/kinds/:slug', 'kind');
router.register('/kinds', 'kinds');
```

In `AppHelper.jsx`, import the three new page components and add them to the `PAGES` map (keys matching the route names registered above):

```jsx
import Kind from '../pages/Kind.jsx';
import KindEdit from '../pages/KindEdit.jsx';
import KindNew from '../pages/KindNew.jsx';

const PAGES = {
  // ...existing entries...
  kind: <Kind />,
  kindEdit: <KindEdit />,
  kindNew: <KindNew />,
};
```

## Files to Change

- `frontend/assets/js/utils/HashRouteResolver.js` — add the three new route registrations in `#buildRouter()`, as described above.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — import `Kind`/`KindEdit`/`KindNew` and add the three new `PAGES` entries.
- Existing `HashRouteResolver` spec file — extend with coverage for `/kinds/:slug`, `/kinds/new`, `/kinds/:slug/edit` each resolving to the correct page identifier (`kind`/`kindNew`/`kindEdit`), including a case confirming `/kinds/new` and `/kinds/some-slug/edit` do **not** get swallowed by the `/kinds/:slug` wildcard.
- Existing `AppHelper` spec file — extend with coverage confirming the three new `PAGES` entries render the right component (`Kind`/`KindNew`/`KindEdit`).
