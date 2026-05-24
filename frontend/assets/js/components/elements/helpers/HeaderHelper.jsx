import React from 'react';

export default class HeaderHelper {
  static renderLoading() {
    return this.#renderShell(
      this.#renderCategories(false, []),
      <span className='navbar-text text-muted'>Loading navigation...</span>
    );
  }

  static renderError(error) {
    return this.#renderShell(
      this.#renderCategories(false, []),
      <span className='navbar-text text-danger'>{`Navigation unavailable: ${error}`}</span>
    );
  }

  static render(logged, categories, onLogoff) {
    return this.#renderShell(
      this.#renderCategories(logged, categories),
      this.#renderAuth(logged, onLogoff)
    );
  }

  static #renderShell(categoriesMenu, authMenu) {
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
            {authMenu}
          </div>
        </nav>
      </div>
    );
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
            Categories
          </a>
          <div className='dropdown-menu'>{links}</div>
        </li>
      </ul>
    );
  }

  static #renderAuth(logged, onLogoff) {
    if (logged) {
      return (
        <ul className='nav navbar-nav'>
          <li>
            <a className='nav-link' href='' onClick={onLogoff}>
              Logoff
            </a>
          </li>
        </ul>
      );
    }

    return (
      <ul className='nav navbar-nav'>
        <li>
          <a className='nav-link' href='' data-bs-toggle='modal' data-bs-target='#login-modal'>
            Login
          </a>
        </li>
      </ul>
    );
  }
}
