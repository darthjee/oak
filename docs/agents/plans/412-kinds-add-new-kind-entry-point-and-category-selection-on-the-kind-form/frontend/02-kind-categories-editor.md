# Kind categories editor component

Add a categories editor for the kind form mirroring `CategoryKindsEditor` (select of all available categories + Add button, then the list of selected categories each with a Remove button).

- Prefer reusing existing building blocks (`CollectionSelect`, the list/select pattern of `CategoryKindsEditorSelect` / `CategoryKindsEditorList`). Either generalize those components to work on any `{ name, slug }` collection (and keep `CategoryKindsEditor` using them), or add `KindCategoriesEditor` (+ select/list subcomponents) mirroring them — pick whichever keeps the code simplest without breaking the category form.
- Props: `allCategories`, `selectedCategories`, `selectedSlug`, `onSelectChange(slug)`, `onAddCategory()`, `onRemoveCategory(slug)`.
- Jasmine specs for the new/changed components.

## Files to Change
- `frontend/assets/js/components/elements/KindCategoriesEditor.jsx` (+ any select/list subcomponents/helpers) — new, or generalized versions of the `CategoryKindsEditor*` components.
- `frontend/spec/components/elements/` — specs for the new/changed components.
