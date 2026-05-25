import React from 'react';
import Carousel from 'react-bootstrap/Carousel';
import CategoryItemLinks from '../../elements/CategoryItemLinks.jsx';

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
    return (
      <div className='container mt-4'>
        <p className='text-muted'>Loading category item...</p>
      </div>
    );
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
        {this.#renderCarousel(item.photos, item.name)}
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
          <p className='mb-2'>
            <strong>Category:</strong>
            {' '}
            {item.category?.name}
          </p>
          <p className='mb-2'>
            <strong>Kind:</strong>
            {' '}
            {item.kind?.name}
          </p>
          <p className='mb-0'>{item.description}</p>
        </div>
      </div>
    );
  }

  static #renderCarousel(photos, name) {
    if (!Array.isArray(photos) || photos.length === 0) {
      return null;
    }

    return (
      <div className='mb-4'>
        <h5>Photos</h5>
        <Carousel>
          {photos.map((photo) => this.#renderPhotoItem(photo, name))}
        </Carousel>
      </div>
    );
  }

  static #renderPhotoItem(photo, name) {
    return (
      <Carousel.Item key={photo.photo_url}>
        <img
          className='d-block w-100'
          src={photo.photo_url}
          alt={name}
        />
      </Carousel.Item>
    );
  }
}
