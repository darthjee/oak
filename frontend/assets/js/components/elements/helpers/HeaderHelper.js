import React from 'react';

export default class HeaderHelper {
  static renderLoading() {
    return this.#renderShell(
      this.#renderCategories(false, []),
      React.createElement(
        'span',
        { className: 'navbar-text text-muted' },
        'Loading navigation...'
      )
    );
  }

  static renderError(error) {
    return this.#renderShell(
      this.#renderCategories(false, []),
      React.createElement(
        'span',
        { className: 'navbar-text text-danger' },
        `Navigation unavailable: ${error}`
      )
    );
  }

  static render(logged, categories, onLogoff) {
    return this.#renderShell(
      this.#renderCategories(logged, categories),
      this.#renderAuth(logged, onLogoff)
    );
  }

  static #renderShell(categoriesMenu, authMenu) {
    return React.createElement(
      'div',
      { className: 'flex-column align-items-center bg-light border-bottom shadow-sm' },
      React.createElement(
        'nav',
        { className: 'navbar navbar-expand-sm navbar-light bg-light' },
        React.createElement('a', { className: 'navbar-brand', href: '/#/' }, 'Oak'),
        React.createElement(
          'button',
          {
            className: 'navbar-toggler',
            type: 'button',
            'data-bs-toggle': 'collapse',
            'data-bs-target': '#navbarSupportedContent',
            'aria-controls': 'navbarSupportedContent',
            'aria-expanded': 'false',
            'aria-label': 'Toggle navigation',
          },
          React.createElement('span', { className: 'navbar-toggler-icon' })
        ),
        React.createElement(
          'div',
          { className: 'collapse navbar-collapse', id: 'navbarSupportedContent' },
          categoriesMenu,
          authMenu
        )
      )
    );
  }

  static #renderCategories(logged, categories) {
    const categoryLinks = categories.map((category) => React.createElement(
      'a',
      {
        key: category.slug,
        className: 'dropdown-item',
        href: `/#/categories/${category.slug}/items`,
      },
      category.name
    ));

    const links = [
      logged
        ? React.createElement(
          'a',
          { key: 'new', className: 'dropdown-item', href: '/#/categories/new' },
          'New'
        )
        : null,
      React.createElement('a', { key: 'all', className: 'dropdown-item', href: '/#/categories' }, 'All'),
      ...categoryLinks,
    ].filter(Boolean);

    return React.createElement(
      'ul',
      { className: 'navbar-nav dropdown' },
      React.createElement(
        'li',
        { className: 'nav-item p-2' },
        React.createElement(
          'a',
          {
            className: 'nav-link dropdown-toggle',
            href: '#',
            role: 'button',
            'data-bs-toggle': 'dropdown',
            'aria-expanded': 'false',
          },
          'Categories'
        ),
        React.createElement(
          'div',
          { className: 'dropdown-menu' },
          links
        )
      )
    );
  }

  static #renderAuth(logged, onLogoff) {
    if (logged) {
      return React.createElement(
        'ul',
        { className: 'nav navbar-nav' },
        React.createElement(
          'li',
          null,
          React.createElement(
            'a',
            {
              className: 'nav-link',
              href: '',
              onClick: onLogoff,
            },
            'Logoff'
          )
        )
      );
    }

    return React.createElement(
      'ul',
      { className: 'nav navbar-nav' },
      React.createElement(
        'li',
        null,
        React.createElement(
          'a',
          {
            className: 'nav-link',
            href: '',
            'data-bs-toggle': 'modal',
            'data-bs-target': '#login-modal',
          },
          'Login'
        )
      )
    );
  }
}
