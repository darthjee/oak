import React from 'react';
import CategoryKindsEditorList from './CategoryKindsEditorList.jsx';
import CategoryKindsEditorSelect from './CategoryKindsEditorSelect.jsx';

/**
 * Renders an editable kinds selector for category forms.
 *
 * Displays a select box with all available kinds plus an Add button, followed
 * by the list of currently selected kinds each with a Remove button.
 *
 * @param {Object} props component props
 * @param {Array<Object>} props.allKinds all available kind options
 * @param {Array<Object>} props.selectedKinds currently selected kinds
 * @param {string} props.selectedSlug slug of the currently chosen kind in the select
 * @param {Function} props.onSelectChange callback(slug) when select value changes
 * @param {Function} props.onAddKind callback() when Add button is clicked
 * @param {Function} props.onRemoveKind callback(slug) when a kind Remove button is clicked
 * @returns {JSX.Element} kinds editor section
 */
export default function CategoryKindsEditor({
  allKinds,
  selectedKinds,
  selectedSlug,
  onSelectChange,
  onAddKind,
  onRemoveKind,
}) {
  return (
    <div className='border p-3 mb-3 bg-light rounded'>
      <CategoryKindsEditorSelect
        kinds={allKinds}
        selectedSlug={selectedSlug}
        onSelectChange={onSelectChange}
        onAddKind={onAddKind}
      />
      <CategoryKindsEditorList
        kinds={selectedKinds}
        onRemoveKind={onRemoveKind}
      />
    </div>
  );
}
