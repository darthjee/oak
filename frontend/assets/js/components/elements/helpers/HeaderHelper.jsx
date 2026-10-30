import React from 'react';
import LoginModal from '../LoginModal.jsx';

/**
 * Renders the navigation header HTML for different states.
 */
export default class HeaderHelper {
  /**
   * Renders the header in a loading state.
   *
   * @returns {JSX.Element} header shell with a loading placeholder
   */
  static renderLoading() {
    return this.#renderShell(
      this.#renderCategories(false, []),
      this.#renderKinds(false),
      <span className='navbar-text text-muted'>Loading navigation...</span>
    );
  }

  /**
   * Renders the header in an error state.
   *
   * @param {string} error error message to display
   * @returns {JSX.Element} header shell with an error message
   */
  static renderError(error) {
    return this.#renderShell(
      this.#renderCategories(false, []),
      this.#renderKinds(false),
      <span className='navbar-text text-danger'>{`Navigation unavailable: ${error}`}</span>
    );
  }

  /**
   * Renders the fully populated header.
   *
   * @param {boolean} logged whether the current user is logged in
   * @param {Array<Object>} categories list of category objects to display
   * @param {{onLogoff: Function, onLoginClick: Function, onCloseModal: Function, onAuthSuccess: Function, showModal: boolean, modalMode: ('password'|'device')}} handlers callbacks and modal state
   * @returns {JSX.Element} header shell with categories menu and auth controls
   */
  static render(logged, categories, handlers) {
    return this.#renderShell(
      this.#renderCategories(logged, categories),
      this.#renderKinds(logged),
      this.#renderAuth(logged, handlers),
      this.#renderLoginModal(handlers)
    );
  }

  static #renderShell(categoriesMenu, kindsMenu, authMenu, modal) {
    return (
      <div className='flex-column align-items-center bg-light border-bottom shadow-sm'>
        <nav className='navbar navbar-expand-sm navbar-light bg-light'>
          <a className='navbar-brand' href='/#/'>Oak</a>
          <button
            className='navbar-toggler'
            type='button'
            data-bs-toggle='collapse'
            data-bs-target='#navbarSupportedContent'
            aria-controls='navbarSupportedContent'
            aria-expanded='false'
            aria-label='Toggle navigation'
          >
            <span className='navbar-toggler-icon' />
          </button>
          <div className='collapse navbar-collapse' id='navbarSupportedContent'>
            {categoriesMenu}
            {kindsMenu}
            {authMenu}
          </div>
        </nav>
        {modal}
      </div>
    );
  }

  /**
   * Renders the Kinds dropdown with a "New" entry (logged users only) and an "All" entry.
   *
   * @param {boolean} logged whether the current user is logged in
   * @returns {JSX.Element} dropdown nav item for kinds
   */
  static #renderKinds(logged) {
    const links = [
      logged ? (
        <a key='new' className='dropdown-item' href='/#/kinds/new'>
          New
        </a>
      ) : null,
      <a key='all' className='dropdown-item' href='/#/kinds'>
        All
      </a>,
    ].filter(Boolean);

    return this.#renderDropdown('Kinds', links);
  }

  static #renderCategories(logged, categories) {
    const categoryLinks = categories.map((category) => (
      <a key={category.slug} className='dropdown-item' href={`/#/categories/${category.slug}/items`}>
        {category.name}
      </a>
    ));

    const links = [
      logged ? (
        <a key='new' className='dropdown-item' href='/#/categories/new'>
          New
        </a>
      ) : null,
      <a key='all' className='dropdown-item' href='/#/categories'>
        All
      </a>,
      ...categoryLinks,
    ].filter(Boolean);

    return this.#renderDropdown('Categories', links);
  }

  /**
   * Renders a navbar dropdown with the given title and entries.
   *
   * @param {string} title dropdown toggle label
   * @param {Array<JSX.Element>} links dropdown entries
   * @returns {JSX.Element} dropdown nav item
   */
  static #renderDropdown(title, links) {
    return (
      <ul className='navbar-nav dropdown'>
        <li className='nav-item p-2'>
          <a
            className='nav-link dropdown-toggle'
            href='#'
            role='button'
            data-bs-toggle='dropdown'
            aria-expanded='false'
          >
            {title}
          </a>
          <div className='dropdown-menu'>{links}</div>
        </li>
      </ul>
    );
  }

  static #renderAuth(logged, handlers) {
    if (logged) {
      return this.#renderAccountMenu(handlers);
    }

    return (
      <ul className='nav navbar-nav'>
        <li>
          <a
            className='nav-link'
            href=''
            onClick={(event) => {
              event.preventDefault();
              handlers.onLoginClick();
            }}
          >
            Login
          </a>
        </li>
      </ul>
    );
  }

  /**
   * Renders the Account dropdown shown to logged-in users.
   *
   * @param {{onLogoff: Function}} handlers callbacks used by the menu entries
   * @returns {JSX.Element} dropdown with Authorizations and Logoff entries
   */
  static #renderAccountMenu(handlers) {
    return (
      <ul className='navbar-nav dropdown'>
        <li className='nav-item p-2'>
          <a
            className='nav-link dropdown-toggle'
            href='#'
            role='button'
            data-bs-toggle='dropdown'
            aria-expanded='false'
          >
            Account
          </a>
          <div className='dropdown-menu'>
            <a className='dropdown-item' href='/#/authorizations'>
              Authorizations
            </a>
            <a className='dropdown-item' href='' onClick={handlers.onLogoff}>
              Logoff
            </a>
          </div>
        </li>
      </ul>
    );
  }

  static #renderLoginModal(handlers) {
    return (
      <LoginModal
        show={Boolean(handlers.showModal)}
        mode={handlers.modalMode || 'password'}
        onClose={handlers.onCloseModal}
        onSuccess={handlers.onAuthSuccess}
      />
    );
  }
}
