import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CatalogList from '../../../assets/js/components/elements/CatalogList.jsx';

describe('CatalogList', function() {
  it('renders children inside the standard container structure', function() {
    const html = renderToStaticMarkup(
      <CatalogList>
        <div>First card</div>
        <div>Second card</div>
      </CatalogList>
    );

    expect(html).toContain('container mt-4');
    expect(html).toContain('row');
    expect(html).toContain('First card');
    expect(html).toContain('Second card');
  });
});
