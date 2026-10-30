# "New kind" entry points

- **Kinds index page:** track the logged-in state the same way the Categories page does (`CategoriesController` subscribes and calls `setLogged`; `Categories.jsx` passes `logged` to the helper). Add `setLogged` to `KindsController`, a `logged` state in `Kinds.jsx`, and pass it to `KindsHelper.render(kinds, logged, pagination)`. Render a "New" button (`btn btn-primary mb-3`, `href='/#/kinds/new'`) only when logged in, mirroring `CategoriesHelper#renderNewButton`.
- **Header:** replace `HeaderHelper#renderKindsLink` with a "Kinds" dropdown (same markup pattern as `#renderCategories`) containing **New** → `/#/kinds/new` (only when logged in) and **All** → `/#/kinds`. It needs the `logged` flag in all render states (loading/error → `false`). No per-kind entries.
- Specs: update `KindsHelper_spec`, `KindsController` spec, `Kinds` page spec (if present), and `HeaderHelper_spec` / `Header_spec` for logged-in vs logged-out output.

## Files to Change
- `frontend/assets/js/components/pages/Kinds.jsx` — `logged` state, pass to helper.
- `frontend/assets/js/components/pages/controllers/KindsController.js` — subscribe to login state, `setLogged`.
- `frontend/assets/js/components/pages/helpers/KindsHelper.jsx` — "New" button for logged users.
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — Kinds dropdown with New/All.
- `frontend/spec/components/pages/helpers/KindsHelper_spec.js`, `frontend/spec/components/pages/controllers/KindsController_spec.js`, `frontend/spec/components/elements/helpers/HeaderHelper_spec.js`, `frontend/spec/components/elements/Header_spec.js` — specs.
