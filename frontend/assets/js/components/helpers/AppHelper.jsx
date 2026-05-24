import React from 'react';
import Header from '../elements/Header.jsx';
import Categories from '../pages/Categories.jsx';

const PAGES = {
  categories: <Categories />,
  home: <p>placeholder</p>,
};

export default class AppHelper {
  static render(page) {
    return (
      <>
        <Header />
        {PAGES[page]}
      </>
    );
  }
}
