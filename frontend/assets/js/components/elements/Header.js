import { useEffect, useMemo, useState } from 'react';
import HeaderController from './controllers/HeaderController.js';
import HeaderHelper from './helpers/HeaderHelper.js';

/**
 * Navigation header component that fetches login state and categories.
 *
 * @returns {JSX.Element} rendered header with navigation links and auth actions
 */
export default function Header() {
  const [logged, setLogged] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const controller = useMemo(
    () => new HeaderController(setLogged, setCategories, setLoading, setError, setRefreshKey),
    []
  );

  useEffect(() => {
    const effect = controller.buildEffect();

    return effect();
  }, [controller, refreshKey]);

  if (loading) {
    return HeaderHelper.renderLoading();
  }

  if (error) {
    return HeaderHelper.renderError(error);
  }

  return HeaderHelper.render(logged, categories, {
    onLogoff: controller.handleLogoff,
    onLoginClick: () => setShowModal(true),
    onCloseModal: () => setShowModal(false),
    onAuthSuccess: () => {
      setRefreshKey((currentKey) => currentKey + 1);
      setShowModal(false);
    },
    showModal,
  });
}
