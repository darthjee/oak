import React from 'react';
import CatalogCard from '../../elements/CatalogCard.jsx';
import CatalogList from '../../elements/CatalogList.jsx';
import ErrorContainer from '../../elements/ErrorContainer.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import PaginationHelper from './PaginationHelper.jsx';

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
    return (
      <>
        {this.#renderNewButton(logged)}
        <CatalogList>
          {categories.map((category) => this.#renderCard(category))}
        </CatalogList>
        <PaginationHelper pagination={pagination} basePath='/#/categories' />
      </>
    );
  }

  /**
   * Renders the "New" button for creating a new category if the user is logged in.
   *
   * @param logged logged whether the current user is logged in
   * @param {boolean} logged whether the current user is logged in
   * @returns {JSX.Element|null} the rendered "New" button or null if not logged in
   */
  static #renderNewButton(logged) {
    if (!logged) return null;
    
    return (
      <a className='btn btn-primary mb-3' href='/#/categories/new'>
        New
      </a>
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
