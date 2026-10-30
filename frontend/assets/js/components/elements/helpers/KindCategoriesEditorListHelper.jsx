import React from 'react';
import CategoryKindBadge from '../CategoryKindBadge.jsx';

/**
 * Renders reusable pieces for the kind categories editor list.
 */
export default class KindCategoriesEditorListHelper {
  /**
   * Renders the list of selected categories or an empty state message.
   *
   * @param {Array<Object>} categories selected categories
   * @param {Function} onRemoveCategory callback(slug) when a category Remove button is clicked
   * @returns {JSX.Element|JSX.Element[]} categories badges or empty message
   */
  static renderCategories(categories, onRemoveCategory) {
    if (categories.length === 0) {
      return <p className='mb-0'>No categories selected.</p>;
    }

    return categories.map((category) => (
      <CategoryKindBadge key={category.slug} kind={category} onRemove={onRemoveCategory} />
    ));
  }
}
