import { useEffect, useMemo, useState } from 'react';
import KindNewController from './controllers/KindNewController.js';
import KindNewHelper from './helpers/KindNewHelper.jsx';

/**
 * Page component that displays the kind creation form.
 *
 * @returns {JSX.Element} new kind page with loading, error, or form state
 */
export default function KindNew() {
  const [kind, setKind] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const controller = useMemo(
    () => new KindNewController(setKind, setCategories, setLoading, setSaving, setError),
    []
  );

  useEffect(() => {
    const effect = controller.buildEffect();

    return effect();
  }, [controller]);

  if (loading) {
    return KindNewHelper.renderLoading();
  }

  if (error) {
    return KindNewHelper.renderError(error);
  }

  if (!kind) {
    return KindNewHelper.renderError('Unable to load kind new form.');
  }

  const selectedCategory = categories.find((c) => c.slug === selectedCategorySlug) || null;

  return KindNewHelper.render(
    kind,
    saving,
    (field, value) => controller.onFieldChange(field, value),
    () => controller.save(kind),
    {
      allCategories: categories,
      selectedSlug: selectedCategorySlug,
      onSelectChange: setSelectedCategorySlug,
      onAddCategory: () => controller.onAddCategory(selectedCategory),
      onRemoveCategory: (slug) => controller.onRemoveCategory(slug),
    }
  );
}
