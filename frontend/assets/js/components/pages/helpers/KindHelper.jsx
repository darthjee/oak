import React from 'react';
import CategoryItemInfoCard from '../../elements/CategoryItemInfoCard.jsx';
import ErrorContainer from '../../elements/ErrorContainer.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import OptionalImage from '../../elements/OptionalImage.jsx';

/**
 * Renders the kind page HTML for different states.
 */
export default class KindHelper {
  /**
   * Renders the kind page in a loading state.
   *
   * @returns {JSX.Element} loading placeholder
   */
  static renderLoading() {
    return <LoadingMessage message='Loading kind...' />;
  }

  /**
   * Renders the kind page in an error state.
   *
   * @param {string} error error message to display
   * @returns {JSX.Element} error alert container
   */
  static renderError(error) {
    return <ErrorContainer error={error} />;
  }

  /**
   * Renders the fully populated kind page.
   *
   * @param {Object} kind kind data
   * @param {boolean} logged whether the current user is logged in
   * @returns {JSX.Element} kind content
   */
  static render(kind, logged) {
    return (
      <div className='container mt-4'>
        {this.#renderActions(kind, logged)}
        <CategoryItemInfoCard name={kind.name}>
          <OptionalImage
            src={kind.snap_url}
            alt={kind.name}
            className='img-fluid rounded mb-3'
          />
        </CategoryItemInfoCard>
      </div>
    );
  }

  static #renderActions(kind, logged) {
    return (
      <div className='mb-3'>
        <a className='btn btn-outline-secondary me-2' href='/#/kinds'>
          Back
        </a>
        {this.#renderEditAction(kind, logged)}
      </div>
    );
  }

  static #renderEditAction(kind, logged) {
    if (!logged) {
      return null;
    }

    return (
      <a className='btn btn-secondary' href={`/#/kinds/${kind.slug}/edit`}>
        Edit
      </a>
    );
  }
}
