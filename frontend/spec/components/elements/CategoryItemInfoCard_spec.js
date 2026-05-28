import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CategoryItemInfoCard from '../../../assets/js/components/elements/CategoryItemInfoCard.jsx';

describe('CategoryItemInfoCard', function() {
  it('renders card header and children', function() {
    const html = renderToStaticMarkup(
      <CategoryItemInfoCard name='Oak'>
        <p>Body</p>
      </CategoryItemInfoCard>
    );

    expect(html).toContain('card');
    expect(html).toContain('Oak');
    expect(html).toContain('Body');
  });
});
