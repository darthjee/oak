import React from 'react';
import CollectionSelect from './CollectionSelect.jsx';

/**
 * Renders a labeled category select box with an Add button for the kind categories editor.
 *
 * @param {Object} props component props
 * @param {Array<Object>} props.categories all available category options
 * @param {string} props.selectedSlug slug of the currently chosen category in the select
 * @param {Function} props.onSelectChange callback(slug) when select value changes
 * @param {Function} props.onAddCategory callback() when Add button is clicked
 * @returns {JSX.Element} labeled category select with add button
 */
export default function KindCategoriesEditorSelect({
  categories,
  selectedSlug,
  onSelectChange,
  onAddCategory,
}) {
  return (
    <div className='mb-3'>
      <label className='form-label' htmlFor='kind-new-category-select'>
        Add a Category
      </label>
      <div className='d-flex align-items-center gap-2'>
        <CollectionSelect
          collection={categories}
          id='kind-new-category-select'
          keyColumn='slug'
          labelColumn='name'
          onChange={onSelectChange}
          placeholder='-- Select a category --'
          selectedValue={selectedSlug || ''}
        />
        <button className='btn btn-success' onClick={onAddCategory} type='button'>
          Add
        </button>
      </div>
    </div>
  );
}
