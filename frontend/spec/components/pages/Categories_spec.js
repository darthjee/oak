import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Categories from '../../../assets/js/components/pages/Categories.jsx';

describe('Categories', function() {
  it('renders loading state on first render', function() {
    const html = renderToStaticMarkup(React.createElement(Categories));

    expect(html).toContain('Loading categories...');
  });
});
