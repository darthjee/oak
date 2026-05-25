import React from 'react';
import Pagination from '../../elements/Pagination.jsx';

/**
 * Renders the category items page HTML for different states.
 */
export default class CategoryItemsHelper {
  /**
   * Renders the category items page in a loading state.
   *
   * @returns {JSX.Element} loading placeholder
   */
  static renderLoading() {
    return (
      <div className='container mt-4'>
        <p className='text-muted'>Loading category items...</p>
      </div>
    );
  }

  /**
   * Renders the category items page in an error state.
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
   * Renders the fully populated category items page.
   *
   * @param {Array<Object>} items list of item objects to display
   * @param {boolean} logged whether the current user is logged in
   * @param {Object} pagination pagination metadata for the current page
   * @param {string} slug category slug used to build links
   * @returns {JSX.Element} category items grid with pagination controls
   */
  static render(items, logged, pagination, slug) {
    const page = pagination?.page ?? 1;
    const pages = pagination?.pages ?? 1;
    const perPage = pagination?.perPage ?? 10;
    const basePath = `/#/categories/${slug}/items`;

    return (
      <div className='container mt-4'>
        {logged && (
          <>
            <a className='btn btn-primary mb-3 me-2' href={`/#/categories/${slug}/items/new`}>
              New
            </a>
            <a className='btn btn-secondary mb-3' href={`/#/categories/${slug}/edit`}>
              Edit
            </a>
          </>
        )}
        <div className='row'>
          {items.map((item) => this.#renderCard(item, slug))}
        </div>
        <Pagination
          currentPage={page}
          totalPages={pages}
          perPage={perPage}
          basePath={basePath}
        />
      </div>
    );
  }

  static #renderCard(item, slug) {
    const { id, name, snap_url: snapUrl, link } = item;
    const itemPath = `/#/categories/${slug}/items/${id}`;

    return (
      <div key={id} className='col-sm-6 col-md-4 col-lg-3 mb-4'>
        <div className='card h-100'>
          <a href={itemPath} className='text-decoration-none text-dark'>
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
          {link?.url && (
            <div className='card-footer bg-white border-0 pt-0'>
              <a href={link.url} target='_blank' rel='noreferrer' className='card-link'>
                {link.text || 'External link'}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }
}
