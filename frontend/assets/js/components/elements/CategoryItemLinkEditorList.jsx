import React from 'react';
import CategoryItemLinkEditor from './CategoryItemLinkEditor.jsx';

/**
 * Renders editable list rows for category item links.
 *
 * @param {Object} props component props
 * @param {Array<Object>} props.links links list
 * @param {Function} props.onLinkChange callback(index, field, value)
 * @param {Function} props.onRemoveLink callback(index)
 * @returns {JSX.Element} editable link rows
 */
export default function CategoryItemLinkEditorList({ links, onLinkChange, onRemoveLink }) {
  return links.map((link, index) => (
    <CategoryItemLinkEditor
      key={`link-${link.id || index}`}
      index={index}
      link={link}
      onLinkChange={onLinkChange}
      onRemoveLink={onRemoveLink}
    />
  ));
}
