import React from 'react';

/**
 * Renders editable kind select input for category item forms.
 *
 * @param {Object} props component props
 * @param {Array<Object>} props.kinds kinds options
 * @param {string} props.value selected kind slug
 * @param {Function} props.onChange select change handler
 * @returns {JSX.Element} kind select field
 */
export default function CategoryItemKindSelect({ kinds, value, onChange }) {
  return (
    <div className='mb-3'>
      <label className='form-label' htmlFor='category-item-edit-kind'>
        Kind
      </label>
      <select className='form-select' id='category-item-edit-kind' onChange={onChange} value={value || ''}>
        {kinds.map((kind) => (
          <option key={kind.slug} value={kind.slug}>
            {kind.name}
          </option>
        ))}
      </select>
    </div>
  );
}
