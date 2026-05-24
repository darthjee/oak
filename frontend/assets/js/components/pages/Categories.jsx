import { useEffect, useMemo, useState } from 'react';
import CategoriesController from './controllers/CategoriesController.js';
import CategoriesHelper from './helpers/CategoriesHelper.jsx';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [logged, setLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const controller = useMemo(
    () => new CategoriesController(setCategories, setLogged, setLoading, setError),
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

  return CategoriesHelper.render(categories, logged);
}
