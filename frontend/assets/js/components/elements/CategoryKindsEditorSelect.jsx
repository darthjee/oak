import React from 'react';
import CategoryKindSelectInput from './CategoryKindSelectInput.jsx';

/**
 * Renders a labeled kind select box with an Add button for the kinds editor.
 *
 * @param {Object} props component props
 * @param {Array<Object>} props.kinds all available kind options
 * @param {string} props.selectedSlug slug of the currently chosen kind in the select
 * @param {Function} props.onSelectChange callback(slug) when select value changes
 * @param {Function} props.onAddKind callback() when Add button is clicked
 * @returns {JSX.Element} labeled kind select with add button
 */
export default function CategoryKindsEditorSelect({
  kinds,
  selectedSlug,
  onSelectChange,
  onAddKind,
}) {
  return (
    <div className='mb-3'>
      <label className='form-label' htmlFor='category-new-kind-select'>
        Add a Kind
      </label>
      <CategoryKindSelectInput
        kinds={kinds}
        onAddKind={onAddKind}
        onSelectChange={onSelectChange}
        selectedSlug={selectedSlug}
      />
    </div>
  );
}
