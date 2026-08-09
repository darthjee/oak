# Front-End Examples

Code snippets referenced by [component-pattern.md](component-pattern.md) — the Component/Controller/Helper split for a `Categories` page.

## Component (`.jsx`)

```jsx
// pages/Categories.jsx
function Categories() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const controller = new CategoriesController(setCategories, setError, setLoading);

  useEffect(controller.buildEffect(), []);

  if (loading) return CategoriesHelper.renderLoading();
  if (error)   return CategoriesHelper.renderError(error);

  return CategoriesHelper.render(categories);
}
```

## Controller (`.js` in `controllers/`)

```js
// pages/controllers/CategoriesController.js
class CategoriesController {
  constructor(setCategories, setError, setLoading) { ... }

  buildEffect() {
    return () => {
      fetchCategories()
        .then(data => this.#setCategories(data))
        .catch(err => this.#setError(err.message))
        .finally(() => this.#setLoading(false));
    };
  }
}
```

## Helper (`.jsx` in `helpers/`)

```jsx
// pages/helpers/CategoriesHelper.jsx
class CategoriesHelper {
  static renderLoading() { return <LoadingSpinner />; }
  static renderError(error) { return <ErrorAlert error={error} />; }
  static render(categories) { return <CategoriesList categories={categories} />; }
}
```
