import React from 'react';
import CategoryKindBadge from './CategoryKindBadge.jsx';

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
        {kinds.length === 0
          ? <p className='mb-0'>No kinds selected.</p>
          : kinds.map((kind) => (
            <CategoryKindBadge key={kind.slug} kind={kind} onRemove={onRemoveKind} />
          ))}
      </div>
    </div>
  );
}
