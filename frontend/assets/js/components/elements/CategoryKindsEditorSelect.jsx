import React from 'react';

/**
 * Renders a kind select box with an Add button for the kinds editor.
 *
 * @param {Object} props component props
 * @param {Array<Object>} props.kinds all available kind options
 * @param {string} props.selectedSlug slug of the currently chosen kind in the select
 * @param {Function} props.onSelectChange callback(slug) when select value changes
 * @param {Function} props.onAddKind callback() when Add button is clicked
 * @returns {JSX.Element} kind select with add button
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
      <div className='d-flex align-items-center gap-2'>
        <select
          className='form-select'
          id='category-new-kind-select'
          onChange={(e) => onSelectChange(e.target.value)}
          value={selectedSlug || ''}
        >
          <option value=''>-- Select a kind --</option>
          {kinds.map((kind) => (
            <option key={kind.slug} value={kind.slug}>
              {kind.name}
            </option>
          ))}
        </select>
        <button className='btn btn-success' onClick={onAddKind} type='button'>
          Add
        </button>
      </div>
    </div>
  );
}
