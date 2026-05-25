import React from 'react';
import CatalogCard from '../../elements/CatalogCard.jsx';
import ErrorContainer from '../../elements/ErrorContainer.jsx';
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
    return <ErrorContainer error={error} />;
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
      <CatalogCard
        key={slug}
        href={`/#/categories/${slug}/items`}
        title={name}
        imageSrc={snapUrl}
      />
    );
  }
}
