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

  const onFieldChange = (field, value) => {
    setItem((current) => ({ ...current, [field]: value }));
  };

  const onLinkChange = (index, field, value) => {
    setItem((current) => {
      const links = [...(current.links || [])];
      links[index] = { ...(links[index] || {}), [field]: value };
      return { ...current, links };
    });
  };

  const onRemoveLink = (index) => {
    setItem((current) => {
      const links = [...(current.links || [])];
      links.splice(index, 1);
      return { ...current, links };
    });
  };

  const onAddLink = () => {
    setItem((current) => ({
      ...current,
      links: [...(current.links || []), { text: '', url: '' }],
    }));
  };

  const onSave = () => {
    controller.save(item);
  };

  const slug = item.category?.slug || '';
  const cancelHref = `/#/categories/${slug}/items`;

  return CategoryItemEditHelper.render(
    item,
    kinds,
    saving,
    onFieldChange,
    onLinkChange,
    onRemoveLink,
    onAddLink,
    onSave,
    cancelHref
  );
}
