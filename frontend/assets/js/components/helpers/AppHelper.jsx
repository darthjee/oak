import React from 'react';
import Header from '../elements/Header.jsx';
import Categories from '../pages/Categories.jsx';
import CategoryItem from '../pages/CategoryItem.jsx';
import CategoryItems from '../pages/CategoryItems.jsx';
import Kinds from '../pages/Kinds.jsx';

const PAGES = {
  categories: <Categories />,
  categoryItem: <CategoryItem />,
  categoryItems: <CategoryItems />,
  home: <Categories />,
  kinds: <Kinds />,
};

/**
 * Renders the top-level application layout for a given page identifier.
 */
export default class AppHelper {
  /**
   * Renders the full page layout, including the header and the requested page content.
   *
   * @param {string} page page identifier, e.g. `'categories'` or `'home'`
   * @returns {JSX.Element} application layout with header and page content
   */
  static render(page) {
    return (
      <>
        <Header />
        {PAGES[page]}
      </>
    );
  }
}
