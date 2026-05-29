import React from 'react';
import CategoryKindBadge from '../CategoryKindBadge.jsx';

/**
 * Renders reusable pieces for the category kinds editor list.
 */
export default class CategoryKindsEditorListHelper {
  /**
   * Renders the list of selected kinds or an empty state message.
   *
   * @param {Array<Object>} kinds selected kinds
   * @param {Function} onRemoveKind callback(slug) when a kind Remove button is clicked
   * @returns {JSX.Element} kinds list or empty message
   */
  static renderKinds(kinds, onRemoveKind) {
    if (kinds.length === 0) {
      return <p className='mb-0'>No kinds selected.</p>;
    }

    return kinds.map((kind) => (
      <CategoryKindBadge key={kind.slug} kind={kind} onRemove={onRemoveKind} />
    ));
  }
}
