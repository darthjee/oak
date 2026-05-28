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
  const handleTextChange = buildLinkFieldHandler(onLinkChange, index, 'text');
  const handleUrlChange = buildLinkFieldHandler(onLinkChange, index, 'url');

  return (
    <div className='border p-3 mb-3 bg-light rounded'>
      <LabeledInput
        id={`link-text-${index}`}
        label='Text'
        value={link.text || ''}
        onChange={handleTextChange}
      />
      <LabeledInput
        id={`link-url-${index}`}
        label='URL'
        value={link.url || ''}
        onChange={handleUrlChange}
      />
      {renderRemoveAction(onRemoveLink, index)}
    </div>
  );
}

function buildLinkFieldHandler(onLinkChange, index, field) {
  return (event) => onLinkChange(index, field, event.target.value);
}

function renderRemoveAction(onRemoveLink, index) {
  return (
    <div className='text-end'>
      <button
        className='btn btn-danger btn-sm'
        onClick={() => onRemoveLink(index)}
        type='button'
      >
        Remove
      </button>
    </div>
  );
}
