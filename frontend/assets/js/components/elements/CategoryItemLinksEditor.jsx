import React from 'react';
import CategoryItemLinkEditorList from './CategoryItemLinkEditorList.jsx';
import CategoryItemLinksEditorHelper from './helpers/CategoryItemLinksEditorHelper.jsx';

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
      <CategoryItemLinkEditorList
        links={links}
        onLinkChange={onLinkChange}
        onRemoveLink={onRemoveLink}
      />
      {CategoryItemLinksEditorHelper.renderAddLinkButton(onAddLink)}
    </div>
  );
}
