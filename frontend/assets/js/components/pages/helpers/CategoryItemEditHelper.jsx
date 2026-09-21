import React from 'react';
import CategoryItemInfoCard from '../../elements/CategoryItemInfoCard.jsx';
import CategoryItemKindSelect from '../../elements/CategoryItemKindSelect.jsx';
import CategoryItemLinksEditor from '../../elements/CategoryItemLinksEditor.jsx';
import ErrorContainer from '../../elements/ErrorContainer.jsx';
import LabeledInput from '../../elements/LabeledInput.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import PhotosCarousel from '../../elements/PhotosCarousel.jsx';

/** File extensions accepted by the photo upload input, matching the backend/proxy allow-list. */
const ALLOWED_PHOTO_EXTENSIONS = '.jpg,.jpeg,.png';

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
   * @param {Object} formState form state and callbacks
   * @param {Array<Object>} formState.kinds kinds options
   * @param {boolean} formState.saving whether save is currently in progress
   * @param {Function} formState.onFieldChange callback(field, value)
   * @param {Function} formState.onLinkChange callback(index, field, value)
   * @param {Function} formState.onRemoveLink callback(index)
   * @param {Function} formState.onAddLink callback()
   * @param {Function} formState.onSave callback()
   * @param {string|null} [formState.cancelHref] optional href for the cancel/back button;
   *   defaults to the item show page URL derived from item data
   * @param {Object} [photo] photo section state and callbacks
   * @param {boolean} [photo.uploading] whether a photo upload is currently in progress
   * @param {string|null} [photo.uploadError] photo upload error message, when present
   * @param {File|null} [photo.selectedFile] file currently selected for upload
   * @param {Function|null} [photo.onSelectFile] callback(file) invoked when the file input
   *   changes
   * @param {Function|null} [photo.onUploadPhoto] callback(file) invoked when the upload button
   *   is clicked
   * @param {number|string|null} [photo.deletingPhotoId] id of the photo currently being
   *   deleted, if any
   * @param {Object|null} [photo.deleteErrorByPhotoId] map of photo id to delete error message
   * @param {Function|null} [photo.onDeletePhoto] callback(photoId) invoked when a photo's
   *   delete button is confirmed
   * @returns {JSX.Element} category item edit content
   */
  static render(item, formState, photo = {}) {
    const {
      kinds,
      saving,
      onFieldChange,
      onLinkChange,
      onRemoveLink,
      onAddLink,
      onSave,
      cancelHref = null,
    } = formState;

    return (
      <div className='container mt-4'>
        {this.#renderActions(item, saving, onSave, cancelHref)}
        {this.#renderInfoCard(item, kinds, onFieldChange)}

        <CategoryItemLinksEditor
          links={this.#normalizeLinks(item.links)}
          onAddLink={onAddLink}
          onLinkChange={onLinkChange}
          onRemoveLink={onRemoveLink}
        />

        {this.#renderPhotoSection(item, photo)}
      </div>
    );
  }

  static #renderActions(item, saving, onSave, cancelHref = null) {
    const slug = item.category?.slug || '';
    const href = cancelHref ?? `/#/categories/${slug}/items/${item.id}`;

    return (
      <div className='mb-3'>
        <a className='btn btn-outline-secondary me-2' href={href}>
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
          onChange={this.#buildFieldChangeHandler(onFieldChange, 'name')}
        />
        <CategoryItemKindSelect
          kinds={kinds}
          onChange={this.#buildFieldChangeHandler(onFieldChange, 'kind_slug')}
          value={item.kind_slug}
        />
        <LabeledInput
          id='category-item-edit-description'
          label='Description'
          value={item.description || ''}
          onChange={this.#buildFieldChangeHandler(onFieldChange, 'description')}
        />
      </CategoryItemInfoCard>
    );
  }

  static #renderPhotoSection(item, photo = {}) {
    const {
      uploading = false,
      uploadError = null,
      selectedFile = null,
      onSelectFile = null,
      onUploadPhoto = null,
      deletingPhotoId = null,
      deleteErrorByPhotoId = null,
      onDeletePhoto = null,
    } = photo;

    if (!item.id) {
      return null;
    }

    const onFileInputChange = (event) => onSelectFile?.(event.target.files[0] || null);
    const onUploadClick = () => onUploadPhoto?.(selectedFile);

    return (
      <div className='mb-4'>
        <h5>Photos</h5>
        {uploadError && <ErrorContainer error={uploadError} />}
        <div className='d-flex align-items-center mb-3'>
          <input
            accept={ALLOWED_PHOTO_EXTENSIONS}
            className='form-control me-2'
            onChange={onFileInputChange}
            type='file'
          />
          <button className='btn btn-primary' disabled={uploading} onClick={onUploadClick} type='button'>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        <PhotosCarousel
          deleteErrorByPhotoId={deleteErrorByPhotoId}
          deletingPhotoId={deletingPhotoId}
          name={item.name}
          onDeletePhoto={onDeletePhoto}
          photos={item.photos}
        />
      </div>
    );
  }

  static #normalizeLinks(links) {
    return Array.isArray(links) && links.length > 0 ? links : [{ text: '', url: '' }];
  }

  static #buildFieldChangeHandler(onFieldChange, field) {
    return (event) => onFieldChange(field, event.target.value);
  }
}
