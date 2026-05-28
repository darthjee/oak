import React from 'react';
import CategoryItemLinkEditorHelper from './helpers/CategoryItemLinkEditorHelper.jsx';

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
      {CategoryItemLinkEditorHelper.renderLabeledInput(index, 'text', link.text, onLinkChange)}
      {CategoryItemLinkEditorHelper.renderLabeledInput(index, 'url', link.url, onLinkChange)}
      {CategoryItemLinkEditorHelper.renderRemoveAction(onRemoveLink, index)}
    </div>
  );
}
