import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import OptionalImage from '../../../assets/js/components/elements/OptionalImage.jsx';

describe('OptionalImage', function() {
  it('renders empty output when src is not present', function() {
    const html = renderToStaticMarkup(<OptionalImage alt='Oak' />);

    expect(html).toBe('');
  });

  it('renders image when src is present', function() {
    const html = renderToStaticMarkup(
      <OptionalImage src='http://example.com/oak.png' alt='Oak' />
    );

    expect(html).toContain('http://example.com/oak.png');
    expect(html).toContain('alt="Oak"');
  });
});
