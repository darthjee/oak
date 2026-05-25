import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import ErrorContainer from '../../../assets/js/components/elements/ErrorContainer.jsx';

describe('ErrorContainer', function() {
  it('renders alert with prefixed error message', function() {
    const html = renderToStaticMarkup(<ErrorContainer error='network failure' />);

    expect(html).toContain('Error: network failure');
  });
});
