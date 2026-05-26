import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CatalogCard from '../../../assets/js/components/elements/CatalogCard.jsx';

describe('CatalogCard', function() {
  it('renders title and link', function() {
    const html = renderToStaticMarkup(
      <CatalogCard href='/#/categories/project/items' title='Project' />
    );

    expect(html).toContain('/#/categories/project/items');
    expect(html).toContain('Project');
  });

  it('renders footer content when present', function() {
    const html = renderToStaticMarkup(
      <CatalogCard
        href='/#/categories/project/items/1'
        title='Oak'
        footer={<div>Footer content</div>}
      />
    );

    expect(html).toContain('Footer content');
  });
});
