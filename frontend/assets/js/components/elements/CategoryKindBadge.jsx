import React from 'react';

/**
 * Renders a category kind badge.
 *
 * @param {Object} props component props
 * @param {Object} props.kind category kind data
 * @returns {JSX.Element} rendered badge
 */
export default function CategoryKindBadge({ kind }) {
  return (
    <span className='badge text-bg-primary me-2 mb-2'>
      {kind.name}
    </span>
  );
}
