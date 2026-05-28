import React from 'react';
import CategoryItemInfoCard from '../../elements/CategoryItemInfoCard.jsx';
import CategoryItemLinks from '../../elements/CategoryItemLinks.jsx';
import ErrorContainer from '../../elements/ErrorContainer.jsx';
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
    return <ErrorContainer error={error} />;
  }

  /**
   * Renders the fully populated category item page.
   *
   * @param {Object} item item data
   * @param {boolean} logged whether the current user is logged in
   * @returns {JSX.Element} category item content
   */
  static render(item, logged) {
    return (
      <div className='container mt-4'>
        {this.#renderActions(item, item.id, logged)}
        {this.#renderInfo(item)}
        {this.#renderLinks(item)}
        {this.#renderPhotosCarousel(item)}
      </div>
    );
  }

  static #renderActions(item, id, logged) {
    const slug = item.category?.slug || '';

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
      <CategoryItemInfoCard name={item.name}>
        <LabelValueParagraph label='Category' value={item.category?.name} />
        <LabelValueParagraph label='Kind' value={item.kind?.name} />
        <p className='mb-0'>{item.description}</p>
      </CategoryItemInfoCard>
    );
  }


  static #renderLinks(item) {
    if (!item.links || item.links.length === 0) {
      return null;
    }

    return <CategoryItemLinks links={item.links} />;
  }

  static #renderPhotosCarousel(item) {
    if (!item.photos || item.photos.length === 0) {
      return null;
    }

    return <PhotosCarousel photos={item.photos} name={item.name} />;
  }
}
