import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Header from '../../../assets/js/components/elements/Header.js';

describe('Header', function() {
  it('renders loading state on first render', function() {
    const html = renderToStaticMarkup(React.createElement(Header));

    expect(html).toContain('Oak');
    expect(html).toContain('Loading navigation...');
  });
});
