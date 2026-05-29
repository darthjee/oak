import React from 'react';
import CategoryItemInfoCard from '../../elements/CategoryItemInfoCard.jsx';
import CategoryKinds from '../../elements/CategoryKinds.jsx';
import ErrorContainer from '../../elements/ErrorContainer.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import OptionalImage from '../../elements/OptionalImage.jsx';
import PageActionsHelper from './PageActionsHelper.jsx';

/**
 * Renders the category page HTML for different states.
 */
export default class CategoryHelper {
  /**
   * Renders the category page in a loading state.
   *
   * @returns {JSX.Element} loading placeholder
   */
  static renderLoading() {
    return <LoadingMessage message='Loading category...' />;
  }

  /**
   * Renders the category page in an error state.
   *
   * @param {string} error error message to display
   * @returns {JSX.Element} error alert container
   */
  static renderError(error) {
    return <ErrorContainer error={error} />;
  }

  /**
   * Renders the fully populated category page.
   *
   * @param {Object} category category data
   * @returns {JSX.Element} category content
   */
  static render(category) {
    return (
      <div className='container mt-4'>
        {this.#renderActions(category)}
        <CategoryItemInfoCard name={category.name}>
          <OptionalImage
            src={category.snap_url}
            alt={category.name}
            className='img-fluid rounded mb-3'
          />
          <CategoryKinds kinds={category.kinds} />
        </CategoryItemInfoCard>
      </div>
    );
  }

  static #renderActions(category) {
    return PageActionsHelper.render(
      '/#/categories',
      `/#/categories/${category.slug}/items`,
      'Items'
    );
  }
}
