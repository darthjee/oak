import { useEffect, useMemo, useState } from 'react';
import HeaderController from './controllers/HeaderController.js';
import HeaderHelper from './helpers/HeaderHelper.jsx';
import LoginModalEvents, { MODE_PASSWORD } from '../../utils/LoginModalEvents.js';

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
  const [modalMode, setModalMode] = useState(MODE_PASSWORD);

  const controller = useMemo(
    () => new HeaderController(
      setLogged,
      setCategories,
      setLoading,
      setError,
      setShowModal,
      setModalMode
    ),
    []
  );

  useEffect(() => {
    const effect = controller.buildEffect();

    return effect();
  }, [controller]);

  useEffect(() => {
    const effect = controller.buildModalEffect();

    return effect();
  }, [controller]);

  if (loading) {
    return HeaderHelper.renderLoading();
  }

  if (error) {
    return HeaderHelper.renderError(error);
  }

  return HeaderHelper.render(logged, categories, {
    onLogoff: controller.handleLogoff,
    onLoginClick: () => LoginModalEvents.open(MODE_PASSWORD),
    onCloseModal: () => setShowModal(false),
    onAuthSuccess: () => {
      controller.reload();
      setShowModal(false);
    },
    showModal,
    modalMode,
  });
}
