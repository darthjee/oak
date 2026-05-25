import React from 'react';
import CategoryItemLinks from '../../elements/CategoryItemLinks.jsx';
import LabelValueParagraph from '../../elements/LabelValueParagraph.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import PhotosCarousel from '../../elements/PhotosCarousel.jsx';

/**
 * Renders the category item page HTML for different states.
 */
export default class CategoryItemHelper {
  /**
   * Renders the category item page in a loading state.
   *
   * @returns {JSX.Element} loading placeholder
   */
  static renderLoading() {
    return <LoadingMessage message='Loading category item...' />;
  }

  /**
   * Renders the category item page in an error state.
   *
   * @param {string} error error message to display
   * @returns {JSX.Element} error alert container
   */
  static renderError(error) {
    return (
      <div className='container mt-4'>
        <div className='alert alert-danger'>{`Error: ${error}`}</div>
      </div>
    );
  }

  /**
   * Renders the fully populated category item page.
   *
   * @param {Object} item item data
   * @param {boolean} logged whether the current user is logged in
   * @returns {JSX.Element} category item content
   */
  static render(item, logged) {
    const slug = item.category?.slug || '';

    return (
      <div className='container mt-4'>
        {this.#renderActions(slug, item.id, logged)}
        {this.#renderInfo(item)}
        <CategoryItemLinks links={item.links} />
        <PhotosCarousel photos={item.photos} name={item.name} />
      </div>
    );
  }

  static #renderActions(slug, id, logged) {
    return (
      <div className='mb-3'>
        <a className='btn btn-outline-secondary me-2' href={`/#/categories/${slug}/items`}>
          Back
        </a>
        {logged ? this.#renderEditButton(slug, id) : null}
      </div>
    );
  }

  static #renderEditButton(slug, id) {
    return (
      <a className='btn btn-primary' href={`/#/categories/${slug}/items/${id}/edit`}>
        Edit
      </a>
    );
  }

  static #renderInfo(item) {
    return (
      <div className='card shadow-sm mb-4'>
        <div className='card-header'>{item.name}</div>
        <div className='card-body'>
          <LabelValueParagraph label='Category' value={item.category?.name} />
          <LabelValueParagraph label='Kind' value={item.kind?.name} />
          <p className='mb-0'>{item.description}</p>
        </div>
      </div>
    );
  }
}
