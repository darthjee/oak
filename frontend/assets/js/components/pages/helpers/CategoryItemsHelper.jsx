import React from 'react';
import CatalogList from '../../elements/CatalogList.jsx';
import CategoryItemCard from '../../elements/CategoryItemCard.jsx';
import ErrorContainer from '../../elements/ErrorContainer.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
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
    return <LoadingMessage message='Loading category items...' />;
  }

  /**
   * Renders the category items page in an error state.
   *
   * @param {string} error error message to display
   * @returns {JSX.Element} error alert container
   */
  static renderError(error) {
    return <ErrorContainer error={error} />;
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
    const basePath = `/#/categories/${slug}/items`;

    return (
      <>
        {this.#renderActions(logged, slug)}
        <CatalogList>
          {items.map((item) => this.#renderCard(item, slug))}
        </CatalogList>
        {this.#renderPagination(pagination, basePath)}
      </>
    );
  }

  static #renderCard(item, slug) {
    const { id, name, snap_url: snapUrl, links = [], link } = item;
    const itemPath = `/#/categories/${slug}/items/${id}`;

    return (
      <CategoryItemCard
        key={id}
        href={itemPath}
        title={name}
        imageSrc={snapUrl}
        links={links.length > 0 ? links : link ? [link] : []}
      />
    );
  }

  static #renderActions(logged, slug) {
    if (!logged) {
      return null;
    }

    return (
      <>
        <a className='btn btn-primary mb-3 me-2' href={`/#/categories/${slug}/items/new`}>
          New
        </a>
        <a className='btn btn-secondary mb-3' href={`/#/categories/${slug}/edit`}>
          Edit
        </a>
      </>
    );
  }

  static #renderPagination(pagination, basePath) {
    return (
      <Pagination
        currentPage={pagination?.page ?? 1}
        totalPages={pagination?.pages ?? 1}
        perPage={pagination?.perPage ?? 10}
        basePath={basePath}
      />
    );
  }
}
