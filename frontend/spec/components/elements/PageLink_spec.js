import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PageLink from '../../../assets/js/components/elements/PageLink.jsx';

describe('PageLink', function() {
  it('renders a page link from url template', function() {
    const html = renderToStaticMarkup(
      React.createElement(
        PageLink,
        { urlTemplate: '/#/categories?page=:page&per_page=:perPage', page: 7, perPage: 12 },
        '7'
      )
    );

    expect(html).toContain('/#/categories?page=7&amp;per_page=12');
    expect(html).toContain('>7<');
  });

  it('keeps aria-label when provided', function() {
    const html = renderToStaticMarkup(
      React.createElement(
        PageLink,
        {
          urlTemplate: '/#/categories?page=:page&per_page=:perPage',
          page: 2,
          perPage: 10,
          ariaLabel: 'Next',
        },
        '»'
      )
    );

    expect(html).toContain('aria-label="Next"');
  });
});
