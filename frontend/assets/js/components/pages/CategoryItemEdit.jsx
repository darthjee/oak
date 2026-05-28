import { useEffect, useMemo, useState } from 'react';
import CategoryItemEditController from './controllers/CategoryItemEditController.js';
import CategoryItemEditHelper from './helpers/CategoryItemEditHelper.jsx';

/**
 * Page component that displays the category item edit form.
 *
 * @returns {JSX.Element} edit page with loading, error, or content state
 */
export default function CategoryItemEdit() {
  const [item, setItem] = useState(null);
  const [kinds, setKinds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const controller = useMemo(
    () => new CategoryItemEditController(setItem, setKinds, setLoading, setSaving, setError),
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
    return CategoryItemEditHelper.renderError('Unable to load category item edit form.');
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

  return CategoryItemEditHelper.render(
    item,
    kinds,
    saving,
    onFieldChange,
    onLinkChange,
    onRemoveLink,
    onAddLink,
    onSave
  );
}
