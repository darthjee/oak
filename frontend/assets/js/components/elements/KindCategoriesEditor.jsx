import React from 'react';
import KindCategoriesEditorList from './KindCategoriesEditorList.jsx';
import KindCategoriesEditorSelect from './KindCategoriesEditorSelect.jsx';

/**
 * Renders an editable categories selector for kind forms.
 *
 * Displays a select box with all available categories plus an Add button, followed
 * by the list of currently selected categories each with a Remove button.
 *
 * @param {Object} props component props
 * @param {Array<Object>} props.allCategories all available category options
 * @param {Array<Object>} props.selectedCategories currently selected categories
 * @param {string} props.selectedSlug slug of the currently chosen category in the select
 * @param {Function} props.onSelectChange callback(slug) when select value changes
 * @param {Function} props.onAddCategory callback() when Add button is clicked
 * @param {Function} props.onRemoveCategory callback(slug) when a category Remove button is clicked
 * @returns {JSX.Element} categories editor section
 */
export default function KindCategoriesEditor({
  allCategories,
  selectedCategories,
  selectedSlug,
  onSelectChange,
  onAddCategory,
  onRemoveCategory,
}) {
  return (
    <div className='border p-3 mb-3 bg-light rounded'>
      <KindCategoriesEditorSelect
        categories={allCategories}
        selectedSlug={selectedSlug}
        onSelectChange={onSelectChange}
        onAddCategory={onAddCategory}
      />
      <KindCategoriesEditorList
        categories={selectedCategories}
        onRemoveCategory={onRemoveCategory}
      />
    </div>
  );
}
