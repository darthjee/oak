import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CategoryKindsHelper from '../../../../assets/js/components/elements/helpers/CategoryKindsHelper.jsx';

describe('CategoryKindsHelper', function() {
  describe('.renderKindsBadges', function() {
    const kinds = [{ slug: 'code', name: 'Code' }, { slug: 'hardware', name: 'Hardware' }];

    it('renders a badge for each kind', function() {
      const html = renderToStaticMarkup(
        React.createElement(React.Fragment, null, ...CategoryKindsHelper.renderKindsBadges(kinds))
      );

      expect(html).toContain('Code');
      expect(html).toContain('Hardware');
      expect(html).toContain('badge');
    });

    it('renders no remove button in display mode', function() {
      const html = renderToStaticMarkup(
        React.createElement(React.Fragment, null, ...CategoryKindsHelper.renderKindsBadges(kinds))
      );

      expect(html).not.toContain('btn-danger');
    });
  });
});
