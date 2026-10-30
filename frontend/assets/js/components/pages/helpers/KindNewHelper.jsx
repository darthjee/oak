import React from 'react';
import CategoryItemInfoCard from '../../elements/CategoryItemInfoCard.jsx';
import ErrorContainer from '../../elements/ErrorContainer.jsx';
import KindCategoriesEditor from '../../elements/KindCategoriesEditor.jsx';
import LabeledInput from '../../elements/LabeledInput.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';

/**
 * Renders the kind new page HTML for different states.
 */
export default class KindNewHelper {
  /**
   * Renders the kind new page in a loading state.
   *
   * @returns {JSX.Element} loading placeholder
   */
  static renderLoading() {
    return <LoadingMessage message='Loading kind new form...' />;
  }

  /**
   * Renders the kind new page in an error state.
   *
   * @param {string} error error message to display
   * @returns {JSX.Element} error alert container
   */
  static renderError(error) {
    return <ErrorContainer error={error} />;
  }

  /**
   * Renders the fully populated kind new form.
   *
   * @param {Object} kind kind data
   * @param {boolean} saving whether save is currently in progress
   * @param {Function} onFieldChange callback(field, value)
   * @param {Function} onSave callback() when Save button is clicked
   * @param {Object} [categoriesEditor] categories editor props
   * @param {Array<Object>} [categoriesEditor.allCategories] all available categories
   * @param {string} [categoriesEditor.selectedSlug] slug currently chosen in the category select
   * @param {Function} [categoriesEditor.onSelectChange] callback(slug) when the select changes
   * @param {Function} [categoriesEditor.onAddCategory] callback() when Add is clicked
   * @param {Function} [categoriesEditor.onRemoveCategory] callback(slug) when a category is removed
   * @returns {JSX.Element} kind new form content
   */
  static render(kind, saving, onFieldChange, onSave, categoriesEditor = {}) {
    return (
      <div className='container mt-4'>
        {this.#renderActions(saving, onSave)}
        <CategoryItemInfoCard name={kind.name || 'New Kind'}>
          <LabeledInput
            id='kind-new-name'
            label='Name'
            value={kind.name || ''}
            onChange={this.#buildFieldChangeHandler(onFieldChange, 'name')}
          />
          {this.#renderCategoriesEditor(kind, categoriesEditor)}
        </CategoryItemInfoCard>
      </div>
    );
  }

  static #renderCategoriesEditor(kind, categoriesEditor) {
    const noop = () => {};
    const {
      allCategories = [],
      selectedSlug = '',
      onSelectChange = noop,
      onAddCategory = noop,
      onRemoveCategory = noop,
    } = categoriesEditor;

    return (
      <KindCategoriesEditor
        allCategories={allCategories}
        selectedCategories={kind.categories || []}
        selectedSlug={selectedSlug}
        onSelectChange={onSelectChange}
        onAddCategory={onAddCategory}
        onRemoveCategory={onRemoveCategory}
      />
    );
  }

  static #renderActions(saving, onSave) {
    return (
      <div className='mb-3'>
        <a className='btn btn-outline-secondary me-2' href='/#/kinds'>
          Back
        </a>
        <button className='btn btn-success' disabled={saving} onClick={onSave} type='button'>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    );
  }

  static #buildFieldChangeHandler(onFieldChange, field) {
    return (event) => onFieldChange(field, event.target.value);
  }
}
