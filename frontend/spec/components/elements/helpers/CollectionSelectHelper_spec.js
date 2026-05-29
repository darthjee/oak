import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CollectionSelectHelper from '../../../../assets/js/components/elements/helpers/CollectionSelectHelper.jsx';

describe('CollectionSelectHelper', function() {
  const collection = [
    { slug: 'code', name: 'Code' },
    { slug: 'hardware', name: 'Hardware' },
  ];

  describe('.renderOptions', function() {
    it('renders an option for each item using keyColumn and labelColumn', function() {
      const html = renderToStaticMarkup(
        React.createElement('select', null, ...CollectionSelectHelper.renderOptions(collection, 'slug', 'name'))
      );

      expect(html).toContain('value="code"');
      expect(html).toContain('Code');
      expect(html).toContain('value="hardware"');
      expect(html).toContain('Hardware');
    });

    it('uses keyColumn as the option value', function() {
      const items = [{ id: 1, label: 'One' }, { id: 2, label: 'Two' }];
      const html = renderToStaticMarkup(
        React.createElement('select', null, ...CollectionSelectHelper.renderOptions(items, 'id', 'label'))
      );

      expect(html).toContain('value="1"');
      expect(html).toContain('One');
      expect(html).toContain('value="2"');
      expect(html).toContain('Two');
    });
  });
});
