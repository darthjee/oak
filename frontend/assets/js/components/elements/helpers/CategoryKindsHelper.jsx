import React from 'react';
import CategoryKindBadge from '../CategoryKindBadge.jsx';

/**
 * Renders reusable pieces for the category kinds display.
 */
export default class CategoryKindsHelper {
  /**
   * Renders a list of kind badges for display (read-only).
   *
   * @param {Array<Object>} kinds category kinds
   * @returns {JSX.Element[]} array of kind badge elements
   */
  static renderKindsBadges(kinds) {
    return kinds.map((kind) => (
      <CategoryKindBadge key={kind.slug} kind={kind} />
    ));
  }
}
