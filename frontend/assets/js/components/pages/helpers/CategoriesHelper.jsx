import React from 'react';
import Alert from '../../elements/Alert.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import Pagination from '../../elements/Pagination.jsx';

/**
 * Renders the categories page HTML for different states.
 */
export default class CategoriesHelper {
  /**
   * Renders the categories page in a loading state.
   *
   * @returns {JSX.Element} loading placeholder
   */
  static renderLoading() {
    return <LoadingMessage message='Loading categories...' />;
  }

  /**
   * Renders the categories page in an error state.
   *
   * @param {string} error error message to display
   * @returns {JSX.Element} error alert container
   */
  static renderError(error) {
    return (
      <div className='container mt-4'>
        <Alert message={`Error: ${error}`} />
      </div>
    );
  }

  /**
   * Renders the fully populated categories page.
   *
   * @param {Array<Object>} categories list of category objects to display
   * @param {boolean} logged whether the current user is logged in
   * @param {Object} pagination pagination metadata for the current page
   * @returns {JSX.Element} categories grid with pagination controls
   */
  static render(categories, logged, pagination) {
    const page = pagination?.page ?? 1;
    const pages = pagination?.pages ?? 1;
    const perPage = pagination?.perPage ?? 10;

    return (
      <div className='container mt-4'>
        {logged && (
          <a className='btn btn-primary mb-3' href='/#/categories/new'>
            New
          </a>
        )}
        <div className='row'>
          {categories.map((category) => this.#renderCard(category))}
        </div>
        <Pagination
          currentPage={page}
          totalPages={pages}
          perPage={perPage}
          basePath='/#/categories'
        />
      </div>
    );
  }

  static #renderCard(category) {
    const { slug, name, snap_url: snapUrl } = category;

    return (
      <div key={slug} className='col-sm-6 col-md-4 col-lg-3 mb-4'>
        <div className='card h-100'>
          <a href={`/#/categories/${slug}/items`} className='text-decoration-none text-dark'>
            <div className='card-body'>
              <h5 className='card-title'>{name}</h5>
              {snapUrl && (
                <img
                  src={snapUrl}
                  alt={name}
                  className='img-fluid'
                />
              )}
            </div>
          </a>
        </div>
      </div>
    );
  }
}
