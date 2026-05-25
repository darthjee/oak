import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CategoryItems from '../../../assets/js/components/pages/CategoryItems.jsx';

describe('CategoryItems', function() {
  it('renders loading state on first render', function() {
    const html = renderToStaticMarkup(React.createElement(CategoryItems));

    expect(html).toContain('Loading category items...');
  });
});
