import React from 'react';
import CategoryItemInfoCard from '../../elements/CategoryItemInfoCard.jsx';
import CategoryKindsEditor from '../../elements/CategoryKindsEditor.jsx';
import ErrorContainer from '../../elements/ErrorContainer.jsx';
import LabeledInput from '../../elements/LabeledInput.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';

/**
 * Renders the category new page HTML for different states.
 */
export default class CategoryNewHelper {
  /**
   * Renders the category new page in a loading state.
   *
   * @returns {JSX.Element} loading placeholder
   */
  static renderLoading() {
    return <LoadingMessage message='Loading category new form...' />;
  }

  /**
   * Renders the category new page in an error state.
   *
   * @param {string} error error message to display
   * @returns {JSX.Element} error alert container
   */
  static renderError(error) {
    return <ErrorContainer error={error} />;
  }

  /**
   * Renders the fully populated category new form.
   *
   * @param {Object} category category data
   * @param {Array<Object>} allKinds all available kinds for the select
   * @param {boolean} saving whether save is currently in progress
   * @param {Function} onFieldChange callback(field, value)
   * @param {Function} onAddKind callback() when Add kind button is clicked
   * @param {Function} onRemoveKind callback(slug) when a kind is removed
   * @param {Function} onSave callback() when Save button is clicked
   * @returns {JSX.Element} category new form content
   */
  static render(category, allKinds, saving, onFieldChange, onAddKind, onRemoveKind, onSave) {
    return (
      <div className='container mt-4'>
        {this.#renderActions(saving, onSave)}
        <CategoryItemInfoCard name={category.name || 'New Category'}>
          <LabeledInput
            id='category-new-name'
            label='Name'
            value={category.name || ''}
            onChange={this.#buildFieldChangeHandler(onFieldChange, 'name')}
          />
          <CategoryKindsEditor
            allKinds={allKinds}
            selectedKinds={category.kinds || []}
            selectedSlug={category.kind_slug || ''}
            onSelectChange={(slug) => onFieldChange('kind_slug', slug)}
            onAddKind={onAddKind}
            onRemoveKind={onRemoveKind}
          />
        </CategoryItemInfoCard>
      </div>
    );
  }

  static #renderActions(saving, onSave) {
    return (
      <div className='mb-3'>
        <a className='btn btn-outline-secondary me-2' href='/#/categories'>
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
