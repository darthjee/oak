import React from 'react';
import CatalogCard from '../../elements/CatalogCard.jsx';
import CatalogList from '../../elements/CatalogList.jsx';
import ErrorContainer from '../../elements/ErrorContainer.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import PaginationHelper from './PaginationHelper.jsx';

/**
 * Renders the kinds page HTML for different states.
 */
export default class KindsHelper {
  /**
   * Renders the kinds page in a loading state.
   *
   * @returns {JSX.Element} loading placeholder
   */
  static renderLoading() {
    return <LoadingMessage message='Loading kinds...' />;
  }

  /**
   * Renders the kinds page in an error state.
   *
   * @param {string} error error message to display
   * @returns {JSX.Element} error alert container
   */
  static renderError(error) {
    return <ErrorContainer error={error} />;
  }

  /**
   * Renders the fully populated kinds page.
   *
   * @param {Array<Object>} kinds list of kind objects to display
   * @param {boolean} logged whether the current user is logged in
   * @param {Object} pagination pagination metadata for the current page
   * @returns {JSX.Element} kinds grid with pagination controls
   */
  static render(kinds, logged, pagination) {
    return (
      <>
        {this.#renderNewButton(logged)}
        <CatalogList>
          {kinds.map((kind) => this.#renderCard(kind))}
        </CatalogList>
        {PaginationHelper.render(pagination, '/#/kinds')}
      </>
    );
  }

  /**
   * Renders the "New" button for creating a new kind if the user is logged in.
   *
   * @param {boolean} logged whether the current user is logged in
   * @returns {JSX.Element|null} the rendered "New" button or null if not logged in
   */
  static #renderNewButton(logged) {
    if (!logged) return null;

    return (
      <a className='btn btn-primary mb-3' href='/#/kinds/new'>
        New
      </a>
    );
  }

  static #renderCard(kind) {
    const { slug, name, snap_url: snapUrl } = kind;

    return (
      <CatalogCard
        key={slug}
        href={`/#/kinds/${slug}`}
        title={name}
        imageSrc={snapUrl}
      />
    );
  }
}
