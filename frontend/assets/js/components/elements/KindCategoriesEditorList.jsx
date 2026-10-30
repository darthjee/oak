import React from 'react';
import KindCategoriesEditorListHelper from './helpers/KindCategoriesEditorListHelper.jsx';

/**
 * Renders the list of currently selected categories with remove buttons, or an empty message.
 *
 * @param {Object} props component props
 * @param {Array<Object>} props.categories selected categories
 * @param {Function} props.onRemoveCategory callback(slug) when a category Remove button is clicked
 * @returns {JSX.Element} selected categories list
 */
export default function KindCategoriesEditorList({ categories, onRemoveCategory }) {
  return (
    <div>
      <label className='form-label'>
        Categories
      </label>
      <div className='d-flex flex-wrap gap-2'>
        {KindCategoriesEditorListHelper.renderCategories(categories, onRemoveCategory)}
      </div>
    </div>
  );
}
