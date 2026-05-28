import React from 'react';
import LabeledInput from './LabeledInput.jsx';

/**
 * Renders a single editable link row.
 *
 * @param {Object} props component props
 * @param {Object} props.link link data
 * @param {number} props.index link index
 * @param {Function} props.onLinkChange callback(index, field, value)
 * @param {Function} props.onRemoveLink callback(index)
 * @returns {JSX.Element} editable link row
 */
export default function CategoryItemLinkEditor({
  link,
  index,
  onLinkChange,
  onRemoveLink,
}) {
  return (
    <div className='border p-3 mb-3 bg-light rounded'>
      <LabeledInput
        id={`link-text-${index}`}
        label='Text'
        value={link.text || ''}
        onChange={(event) => onLinkChange(index, 'text', event.target.value)}
      />
      <LabeledInput
        id={`link-url-${index}`}
        label='URL'
        value={link.url || ''}
        onChange={(event) => onLinkChange(index, 'url', event.target.value)}
      />
      <div className='text-end'>
        <button
          className='btn btn-danger btn-sm'
          onClick={() => onRemoveLink(index)}
          type='button'
        >
          Remove
        </button>
      </div>
    </div>
  );
}
