import React from 'react';

/**
 * Builds common page action buttons.
 */
export default class PageActionsHelper {
  /**
   * Renders a default actions row with back and optional primary action.
   *
   * @param {string} backHref back destination
   * @param {string|null} actionHref primary action destination
   * @param {string|null} actionLabel primary action label
   * @returns {JSX.Element} action buttons row
   */
  static render(backHref, actionHref, actionLabel) {
    return (
      <div className='mb-3'>
        {this.#renderBackButton(backHref)}
        {this.#renderPrimaryButton(actionHref, actionLabel)}
      </div>
    );
  }

  static #renderBackButton(backHref) {
    return (
      <a className='btn btn-outline-secondary me-2' href={backHref}>
        Back
      </a>
    );
  }

  static #renderPrimaryButton(actionHref, actionLabel) {
    if (!actionHref || !actionLabel) {
      return null;
    }

    return (
      <a className='btn btn-primary' href={actionHref}>
        {actionLabel}
      </a>
    );
  }
}
