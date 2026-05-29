import { useEffect, useMemo, useState } from 'react';
import CategoryNewController from './controllers/CategoryNewController.js';
import CategoryNewHelper from './helpers/CategoryNewHelper.jsx';

/**
 * Page component that displays the category creation form.
 *
 * @returns {JSX.Element} new category page with loading, error, or form state
 */
export default function CategoryNew() {
  const [category, setCategory] = useState(null);
  const [kinds, setKinds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const controller = useMemo(
    () => new CategoryNewController(setCategory, setKinds, setLoading, setSaving, setError),
    []
  );

  useEffect(() => {
    const effect = controller.buildEffect();

    return effect();
  }, [controller]);

  if (loading) {
    return CategoryNewHelper.renderLoading();
  }

  if (error) {
    return CategoryNewHelper.renderError(error);
  }

  if (!category) {
    return CategoryNewHelper.renderError('Unable to load category new form.');
  }

  const selectedKind = kinds.find((k) => k.slug === category.kind_slug) || null;

  return CategoryNewHelper.render(
    category,
    kinds,
    saving,
    (field, value) => controller.onFieldChange(field, value),
    () => controller.onAddKind(selectedKind),
    (slug) => controller.onRemoveKind(slug),
    () => controller.save(category)
  );
}
