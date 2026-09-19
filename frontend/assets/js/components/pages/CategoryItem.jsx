import { useEffect, useMemo, useState } from 'react';
import CategoryItemController from './controllers/CategoryItemController.js';
import CategoryItemHelper from './helpers/CategoryItemHelper.jsx';

/**
 * Page component that displays a category item details page.
 *
 * @returns {JSX.Element} category item page with loading, error, or content state
 */
export default function CategoryItem() {
  const [item, setItem] = useState(null);
  const [logged, setLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [deleteErrorByPhotoId, setDeleteErrorByPhotoId] = useState({});

  const controller = useMemo(
    () => new CategoryItemController(
      setItem,
      setLogged,
      setLoading,
      setError,
      null,
      null,
      setDeletingPhotoId,
      setDeleteErrorByPhotoId
    ),
    []
  );

  useEffect(() => {
    const effect = controller.buildEffect();

    return effect();
  }, [controller]);

  if (loading) {
    return CategoryItemHelper.renderLoading();
  }

  if (error) {
    return CategoryItemHelper.renderError(error);
  }

  const onDeletePhoto = (photoId) => controller.deletePhoto(item, photoId);

  return CategoryItemHelper.render(item, logged, onDeletePhoto, deletingPhotoId, deleteErrorByPhotoId);
}
