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

  it('renders the footer outside the link', function() {
    const html = renderToStaticMarkup(
      <CatalogCard
        href='/#/categories/project/items/1'
        title='Oak'
        footer={<div>Footer content</div>}
      />
    );

    expect(html.indexOf('</a>')).toBeLessThan(html.indexOf('Footer content'));
  });

  it('renders the photo box without an image when imageSrc is missing', function() {
    const html = renderToStaticMarkup(
      <CatalogCard href='/#/categories/project/items' title='Project' />
    );

    expect(html).toContain('ratio-1x1');
    expect(html).not.toContain('<img');
  });

  it('renders the image with the given src and alt', function() {
    const html = renderToStaticMarkup(
      <CatalogCard
        href='/#/categories/project/items'
        title='Project'
        imageSrc='http://example.com/oak.png'
        imageAlt='Oak photo'
      />
    );

    expect(html).toContain('src="http://example.com/oak.png"');
    expect(html).toContain('alt="Oak photo"');
  });

  it('falls back to the title for alt when imageAlt is missing', function() {
    const html = renderToStaticMarkup(
      <CatalogCard
        href='/#/categories/project/items'
        title='Project'
        imageSrc='http://example.com/oak.png'
      />
    );

    expect(html).toContain('alt="Project"');
  });

  it('renders the photo box before the card body with the title inside it', function() {
    const html = renderToStaticMarkup(
      <CatalogCard
        href='/#/categories/project/items'
        title='Project'
        imageSrc='http://example.com/oak.png'
      />
    );

    const photoIndex = html.indexOf('ratio-1x1');
    const bodyIndex = html.indexOf('class="card-body"');

    expect(photoIndex).toBeGreaterThan(-1);
    expect(photoIndex).toBeLessThan(bodyIndex);
    expect(html).toContain('<div class="card-body"><h5 class="card-title">Project</h5></div>');
  });
});
