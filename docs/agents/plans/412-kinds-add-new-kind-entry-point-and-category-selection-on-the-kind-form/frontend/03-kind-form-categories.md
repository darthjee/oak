# Wire categories into the kind new/edit forms

Mirror `CategoryFormController` / `CategoryNewController` / `CategoryEditController`:

- `KindFormController`:
  - constructor takes a `setCategories` setter (all available categories);
  - `normalizeKind` ensures `categories` is an array;
  - `buildPayload` sends `{ kind: { name, categories: kind.categories.map(({ slug }) => ({ slug })) } }`;
  - add `onAddCategory(category)` (no duplicates, ignore missing slug) and `onRemoveCategory(slug)`;
  - add `fetchCategories(loadErrorMessage)` calling `/categories.json?filters[include_empty]=true` (non-array → `[]`) and `applyLoadedData(safeSet, kind, categories)`.
- `KindNewController` / `KindEditController`: load the kind and the available categories in parallel (`Promise.all`), like the category controllers.
- `KindNew.jsx` / `KindEdit.jsx`: add `categories` (all available) and `selectedCategorySlug` state; pass the editor callbacks to the helper; adding uses the category from `categories` matching `selectedCategorySlug`.
- `KindNewHelper.render`: render the categories editor from step 02 below the name input field.
- Specs: `KindFormController`, `KindNewController`, `KindEditController`, `KindNewHelper`, and page specs — including payload always containing `categories` (also `[]`) and load error handling for the categories fetch.

## Files to Change
- `frontend/assets/js/components/pages/controllers/KindFormController.js`
- `frontend/assets/js/components/pages/controllers/KindNewController.js`
- `frontend/assets/js/components/pages/controllers/KindEditController.js`
- `frontend/assets/js/components/pages/KindNew.jsx`
- `frontend/assets/js/components/pages/KindEdit.jsx`
- `frontend/assets/js/components/pages/helpers/KindNewHelper.jsx`
- `frontend/spec/components/pages/...` — corresponding specs.
