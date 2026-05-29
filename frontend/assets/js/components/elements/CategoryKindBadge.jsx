import React from 'react';

/**
 * Renders a single removable kind badge for the kinds editor.
 *
 * @param {Object} props component props
 * @param {Object} props.kind kind data with slug and name
 * @param {Function} props.onRemove callback(slug) when Remove button is clicked
 * @returns {JSX.Element} removable kind badge
 */
export default function CategoryKindBadge({ kind, onRemove }) {
  return (
    <span className='badge bg-primary d-flex align-items-center gap-1'>
      {kind.name}
      <button
        className='btn btn-sm btn-danger ms-1'
        onClick={() => onRemove(kind.slug)}
        type='button'
      >
        x
      </button>
    </span>
  );
}
