import React from 'react';

/**
 * Builds category kinds UI fragments.
 */
export default class CategoryKindsHelper {
  /**
   * Renders a category kind badge.
   *
   * @param {Object} kind category kind data
   * @returns {JSX.Element} rendered badge
   */
  static renderKindBadge(kind) {
    return (
      <span key={kind.slug} className='badge text-bg-primary me-2 mb-2'>
        {kind.name}
      </span>
    );
  }
}
