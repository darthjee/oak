import React from 'react';

/**
 * Renders a kind select dropdown paired with an Add button.
 *
 * @param {Object} props component props
 * @param {Array<Object>} props.kinds all available kind options
 * @param {string} props.selectedSlug slug of the currently chosen kind
 * @param {Function} props.onSelectChange callback(slug) when select value changes
 * @param {Function} props.onAddKind callback() when Add button is clicked
 * @returns {JSX.Element} select dropdown with add button
 */
export default function CategoryKindSelectInput({
  kinds,
  selectedSlug,
  onSelectChange,
  onAddKind,
}) {
  return (
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
  );
}
