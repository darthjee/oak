import { useEffect, useMemo, useState } from 'react';
import CategoriesController from './controllers/CategoriesController.js';
import CategoriesHelper from './helpers/CategoriesHelper.jsx';

/**
 * Page component that displays the paginated list of categories.
 *
 * @returns {JSX.Element} categories page with loading, error, or content state
 */
export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [logged, setLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const controller = useMemo(
    () => new CategoriesController(setCategories, setPagination, setLogged, setLoading, setError),
    []
  );

  useEffect(() => {
    const effect = controller.buildEffect();

    return effect();
  }, [controller]);

  if (loading) {
    return CategoriesHelper.renderLoading();
  }

  if (error) {
    return CategoriesHelper.renderError(error);
  }

  return CategoriesHelper.render(categories, logged, pagination);
}
