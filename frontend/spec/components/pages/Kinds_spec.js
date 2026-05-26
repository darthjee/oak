import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Kinds from '../../../assets/js/components/pages/Kinds.jsx';

describe('Kinds', function() {
  it('renders loading state on first render', function() {
    const html = renderToStaticMarkup(React.createElement(Kinds));

    expect(html).toContain('Loading kinds...');
  });
});
