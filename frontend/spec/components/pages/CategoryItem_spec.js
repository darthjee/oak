import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CategoryItem from '../../../assets/js/components/pages/CategoryItem.jsx';

describe('CategoryItem', function() {
  it('renders loading state on first render', function() {
    const html = renderToStaticMarkup(React.createElement(CategoryItem));

    expect(html).toContain('Loading category item...');
  });
});
