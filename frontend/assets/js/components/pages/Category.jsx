import { useEffect, useMemo, useState } from 'react';
import CategoryController from './controllers/CategoryController.js';
import CategoryHelper from './helpers/CategoryHelper.jsx';

/**
 * Page component that displays a category details page.
 *
 * @returns {JSX.Element} category page with loading, error, or content state
 */
export default function Category() {
  const [category, setCategory] = useState(null);
  const [logged, setLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const controller = useMemo(
    () => new CategoryController(setCategory, setLogged, setLoading, setError),
    []
  );

  useEffect(() => {
    const effect = controller.buildEffect();

    return effect();
  }, [controller]);

  if (loading) {
    return CategoryHelper.renderLoading();
  }

  if (error) {
    return CategoryHelper.renderError(error);
  }

  return CategoryHelper.render(category, logged);
}
