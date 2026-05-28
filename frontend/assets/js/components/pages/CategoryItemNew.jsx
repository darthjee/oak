import { useEffect, useMemo, useState } from 'react';
import CategoryItemNewController from './controllers/CategoryItemNewController.js';
import CategoryItemEditHelper from './helpers/CategoryItemEditHelper.jsx';

/**
 * Page component that displays the category item creation form.
 *
 * @returns {JSX.Element} new item page with loading, error, or content state
 */
export default function CategoryItemNew() {
  const [item, setItem] = useState(null);
  const [kinds, setKinds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const controller = useMemo(
    () => new CategoryItemNewController(setItem, setKinds, setLoading, setSaving, setError),
    []
  );

  useEffect(() => {
    const effect = controller.buildEffect();

    return effect();
  }, [controller]);

  if (loading) {
    return CategoryItemEditHelper.renderLoading();
  }

  if (error) {
    return CategoryItemEditHelper.renderError(error);
  }

  if (!item) {
    return CategoryItemEditHelper.renderError('Unable to load category item new form.');
  }

  return CategoryItemEditHelper.render(
    item,
    kinds,
    saving,
    (field, value) => controller.onFieldChange(field, value),
    (index, field, value) => controller.onLinkChange(index, field, value),
    (index) => controller.onRemoveLink(index),
    () => controller.onAddLink(),
    () => controller.save(item),
    controller.cancelHref(item)
  );
}
