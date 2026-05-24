import React from 'react';
import Header from '../elements/Header.jsx';
import Categories from '../pages/Categories.jsx';

export default class AppHelper {
  static render(page) {
    return (
      <>
        <Header />
        {page === 'categories' && <Categories />}
        {page === 'home' && <p>placeholder</p>}
      </>
    );
  }
}
