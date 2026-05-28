import React from 'react';
import LabeledInput from './LabeledInput.jsx';

/**
 * Renders editable links controls for category item editing.
 *
 * @param {Object} props component props
 * @param {Array<Object>} props.links links list
 * @param {Function} props.onLinkChange callback(index, field, value)
 * @param {Function} props.onRemoveLink callback(index)
 * @param {Function} props.onAddLink callback()
 * @returns {JSX.Element} editable links section
 */
export default function CategoryItemLinksEditor({
  links,
  onLinkChange,
  onRemoveLink,
  onAddLink,
}) {
  return (
    <div className='mb-4'>
      <h5>Links</h5>
      {links.map((link, index) => (
        <div className='border p-3 mb-3 bg-light rounded' key={`link-${link.id || index}`}>
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
      ))}
      <button className='btn btn-primary btn-sm' onClick={onAddLink} type='button'>
        Add link
      </button>
    </div>
  );
}
