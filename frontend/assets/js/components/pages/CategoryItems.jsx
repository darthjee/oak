import { useEffect, useMemo, useState } from 'react';
import CategoryItemsController, { getCategorySlugFromHash } from './controllers/CategoryItemsController.js';
import CategoryItemsHelper from './helpers/CategoryItemsHelper.jsx';

/**
 * Page component that displays the paginated list of items for a category.
 *
 * @returns {JSX.Element} category items page with loading, error, or content state
 */
export default function CategoryItems() {
  const [items, setItems] = useState([]);
  const [logged, setLogged] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const controller = useMemo(
    () => new CategoryItemsController(setItems, setLogged, setPagination, setLoading, setError),
    []
  );

  useEffect(() => {
    const effect = controller.buildEffect();

    return effect();
  }, [controller]);

  const slug = getCategorySlugFromHash(typeof window === 'undefined' ? '' : window.location.hash);

  if (loading) {
    return CategoryItemsHelper.renderLoading();
  }

  if (error) {
    return CategoryItemsHelper.renderError(error);
  }

  return CategoryItemsHelper.render(items, logged, pagination, slug);
}
