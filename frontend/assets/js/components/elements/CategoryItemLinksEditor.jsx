import React from 'react';
import CategoryItemLinkEditor from './CategoryItemLinkEditor.jsx';

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
        <CategoryItemLinkEditor
          key={`link-${link.id || index}`}
          link={link}
          index={index}
          onLinkChange={onLinkChange}
          onRemoveLink={onRemoveLink}
        />
      ))}
      <button className='btn btn-primary btn-sm' onClick={onAddLink} type='button'>
        Add link
      </button>
    </div>
  );
}
