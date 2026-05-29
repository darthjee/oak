import { renderToStaticMarkup } from 'react-dom/server';
import CategoryKindsEditorListHelper from '../../../../assets/js/components/elements/helpers/CategoryKindsEditorListHelper.jsx';

describe('CategoryKindsEditorListHelper', function() {
  describe('.renderKinds', function() {
    it('renders kind badges when kinds are present', function() {
      const html = renderToStaticMarkup(
        CategoryKindsEditorListHelper.renderKinds(
          [{ slug: 'code', name: 'Code' }, { slug: 'hardware', name: 'Hardware' }],
          () => {}
        )
      );

      expect(html).toContain('Code');
      expect(html).toContain('Hardware');
      expect(html).toContain('badge');
    });

    it('renders empty message when no kinds are selected', function() {
      const html = renderToStaticMarkup(
        CategoryKindsEditorListHelper.renderKinds([], () => {})
      );

      expect(html).toContain('No kinds selected.');
      expect(html).not.toContain('badge');
    });
  });
});
