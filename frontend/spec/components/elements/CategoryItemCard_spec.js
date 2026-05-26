import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CategoryItemCard from '../../../assets/js/components/elements/CategoryItemCard.jsx';

describe('CategoryItemCard', function() {
  it('renders title, link, image, and footer links', function() {
    const html = renderToStaticMarkup(
      <CategoryItemCard
        href='/#/categories/project/items/35'
        title='Oak'
        imageSrc='http://example.com/oak.png'
        links={[{ id: 1, text: 'GitHub', url: 'https://github.com/darthjee/oak' }]}
      />
    );

    expect(html).toContain('/#/categories/project/items/35');
    expect(html).toContain('Oak');
    expect(html).toContain('http://example.com/oak.png');
    expect(html).toContain('Links');
    expect(html).toContain('https://github.com/darthjee/oak');
  });

  it('does not render the links footer when links are empty', function() {
    const html = renderToStaticMarkup(
      <CategoryItemCard
        href='/#/categories/project/items/35'
        title='Oak'
        imageSrc='http://example.com/oak.png'
        links={[]}
      />
    );

    expect(html).not.toContain('Links');
    expect(html).not.toContain('target="_blank"');
  });
});
