import { useEffect, useMemo, useState } from 'react';
import HeaderController from './controllers/HeaderController.js';
import HeaderHelper from './helpers/HeaderHelper.js';

export default function Header() {
  const [logged, setLogged] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const controller = useMemo(
    () => new HeaderController(setLogged, setCategories, setLoading, setError),
    []
  );

  useEffect(() => {
    const effect = controller.buildEffect();

    return effect();
  }, [controller]);

  if (loading) {
    return HeaderHelper.renderLoading();
  }

  if (error) {
    return HeaderHelper.renderError(error);
  }

  return HeaderHelper.render(logged, categories, controller.handleLogoff);
}
