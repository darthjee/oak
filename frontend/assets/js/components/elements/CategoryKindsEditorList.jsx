import React from 'react';
import CategoryKindsEditorListHelper from './helpers/CategoryKindsEditorListHelper.jsx';

/**
 * Renders the list of currently selected kinds with remove buttons, or an empty message.
 *
 * @param {Object} props component props
 * @param {Array<Object>} props.kinds selected kinds
 * @param {Function} props.onRemoveKind callback(slug) when a kind Remove button is clicked
 * @returns {JSX.Element} selected kinds list
 */
export default function CategoryKindsEditorList({ kinds, onRemoveKind }) {
  return (
    <div>
      <label className='form-label'>
        Kinds
      </label>
      <div className='d-flex flex-wrap gap-2'>
        {CategoryKindsEditorListHelper.renderKinds(kinds, onRemoveKind)}
      </div>
    </div>
  );
}
