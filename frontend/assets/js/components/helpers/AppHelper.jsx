import React from 'react';
import Header from '../elements/Header.jsx';
import Categories from '../pages/Categories.jsx';
import CategoryItem from '../pages/CategoryItem.jsx';
import CategoryItemEdit from '../pages/CategoryItemEdit.jsx';
import CategoryItems from '../pages/CategoryItems.jsx';
import Kinds from '../pages/Kinds.jsx';

const PAGES = {
  categories: <Categories />,
  categoryItem: <CategoryItem />,
  categoryItemEdit: <CategoryItemEdit />,
  categoryItems: <CategoryItems />,
  home: <Categories />,
  kinds: <Kinds />,
};

/**
 * Top-level application layout for a given page identifier.
 *
 * @param {Object} props component props
 * @param {string} props.page page identifier, e.g. `'categories'` or `'home'`
 * @param {string} [props.hash=''] current location hash
 * @returns {JSX.Element} application layout with header and page content
 */
export default function AppHelper({ page, hash = '' }) {
  return (
    <>
      <Header />
      <React.Fragment key={hash}>
        {PAGES[page]}
      </React.Fragment>
    </>
  );
}
