import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CardPhoto from '../../../assets/js/components/elements/CardPhoto.jsx';

describe('CardPhoto', function() {
  const wrapperClass = 'class="card-img-top ratio ratio-1x1 bg-body-secondary overflow-hidden"';

  describe('when src is present', function() {
    let html;

    beforeEach(function() {
      html = renderToStaticMarkup(
        <CardPhoto src='http://example.com/oak.png' alt='Oak' />
      );
    });

    it('renders the square wrapper', function() {
      expect(html).toContain(wrapperClass);
    });

    it('renders the image with src, alt and cover fit', function() {
      expect(html).toContain('<img');
      expect(html).toContain('src="http://example.com/oak.png"');
      expect(html).toContain('alt="Oak"');
      expect(html).toContain('class="object-fit-cover"');
    });
  });

  describe('when src is missing', function() {
    it('renders the wrapper without an image', function() {
      const html = renderToStaticMarkup(<CardPhoto alt='Oak' />);

      expect(html).toContain(wrapperClass);
      expect(html).not.toContain('<img');
    });
  });

  describe('when src is an empty string', function() {
    it('renders the wrapper without an image', function() {
      const html = renderToStaticMarkup(<CardPhoto src='' alt='Oak' />);

      expect(html).toContain(wrapperClass);
      expect(html).not.toContain('<img');
    });
  });
});
