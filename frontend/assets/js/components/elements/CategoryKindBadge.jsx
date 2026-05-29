import React from 'react';

/**
 * Renders a single kind badge, optionally with a remove button.
 *
 * When `onRemove` is provided the badge includes a Remove button (editor mode).
 * Without it the badge is rendered read-only (display mode).
 *
 * @param {Object} props component props
 * @param {Object} props.kind kind data with slug and name
 * @param {Function} [props.onRemove] optional callback(slug) when Remove button is clicked
 * @returns {JSX.Element} kind badge
 */
export default function CategoryKindBadge({ kind, onRemove }) {
  if (onRemove) {
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

  return (
    <span className='badge text-bg-primary me-2 mb-2'>
      {kind.name}
    </span>
  );
}
