import React from 'react';
import CategoryItemInfoCard from '../../elements/CategoryItemInfoCard.jsx';
import CategoryItemLinksEditor from '../../elements/CategoryItemLinksEditor.jsx';
import ErrorContainer from '../../elements/ErrorContainer.jsx';
import LabeledInput from '../../elements/LabeledInput.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';

/**
 * Renders the category item edit page HTML for different states.
 */
export default class CategoryItemEditHelper {
  /**
   * Renders the category item edit page in a loading state.
   *
   * @returns {JSX.Element} loading placeholder
   */
  static renderLoading() {
    return <LoadingMessage message='Loading category item edit...' />;
  }

  /**
   * Renders the category item edit page in an error state.
   *
   * @param {string} error error message to display
   * @returns {JSX.Element} error alert container
   */
  static renderError(error) {
    return <ErrorContainer error={error} />;
  }

  /**
   * Renders the fully populated category item edit page.
   *
   * @param {Object} item item data
   * @param {Array<Object>} kinds kinds options
   * @param {boolean} saving whether save is currently in progress
   * @param {Function} onFieldChange callback(field, value)
   * @param {Function} onLinkChange callback(index, field, value)
   * @param {Function} onRemoveLink callback(index)
   * @param {Function} onAddLink callback()
   * @param {Function} onSave callback()
   * @returns {JSX.Element} category item edit content
   */
  static render(
    item,
    kinds,
    saving,
    onFieldChange,
    onLinkChange,
    onRemoveLink,
    onAddLink,
    onSave
  ) {
    return (
      <div className='container mt-4'>
        {this.#renderActions(item, saving, onSave)}
        {this.#renderInfoCard(item, kinds, onFieldChange)}

        <CategoryItemLinksEditor
          links={this.#normalizeLinks(item.links)}
          onAddLink={onAddLink}
          onLinkChange={onLinkChange}
          onRemoveLink={onRemoveLink}
        />
      </div>
    );
  }

  static #renderActions(item, saving, onSave) {
    const slug = item.category?.slug || '';

    return (
      <div className='mb-3'>
        <a className='btn btn-outline-secondary me-2' href={`/#/categories/${slug}/items/${item.id}`}>
          Back
        </a>
        <button className='btn btn-success' disabled={saving} onClick={onSave} type='button'>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    );
  }

  static #renderInfoCard(item, kinds, onFieldChange) {
    return (
      <CategoryItemInfoCard name={item.name || 'Edit Item'}>
        <LabeledInput
          id='category-item-edit-name'
          label='Name'
          value={item.name || ''}
          onChange={(event) => onFieldChange('name', event.target.value)}
        />
        <LabeledInput
          id='category-item-edit-category'
          label='Category'
          readOnly
          value={item.category?.name || ''}
        />
        <div className='mb-3'>
          <label className='form-label' htmlFor='category-item-edit-kind'>
            Kind
          </label>
          <select
            className='form-select'
            id='category-item-edit-kind'
            onChange={(event) => onFieldChange('kind_slug', event.target.value)}
            value={item.kind_slug || ''}
          >
            {kinds.map((kind) => (
              <option key={kind.slug} value={kind.slug}>
                {kind.name}
              </option>
            ))}
          </select>
        </div>
        <LabeledInput
          id='category-item-edit-description'
          label='Description'
          value={item.description || ''}
          onChange={(event) => onFieldChange('description', event.target.value)}
        />
      </CategoryItemInfoCard>
    );
  }

  static #normalizeLinks(links) {
    return Array.isArray(links) && links.length > 0 ? links : [{ text: '', url: '' }];
  }
}
