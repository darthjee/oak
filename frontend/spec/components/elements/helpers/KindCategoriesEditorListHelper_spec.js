import { renderToStaticMarkup } from 'react-dom/server';
import KindCategoriesEditorListHelper from '../../../../assets/js/components/elements/helpers/KindCategoriesEditorListHelper.jsx';
import { noop } from '../../../support/noop.js';

describe('KindCategoriesEditorListHelper', function() {
  describe('.renderCategories', function() {
    it('renders category badges when categories are present', function() {
      const html = renderToStaticMarkup(
        KindCategoriesEditorListHelper.renderCategories(
          [{ slug: 'books', name: 'Books' }, { slug: 'games', name: 'Games' }],
          noop
        )
      );

      expect(html).toContain('Books');
      expect(html).toContain('Games');
      expect(html).toContain('badge');
    });

    it('calls the remove callback with the category slug', function() {
      const onRemove = jasmine.createSpy('onRemove');
      const [badge] = KindCategoriesEditorListHelper.renderCategories(
        [{ slug: 'books', name: 'Books' }],
        onRemove
      );

      badge.props.onRemove(badge.props.kind.slug);

      expect(onRemove).toHaveBeenCalledWith('books');
    });

    it('renders empty message when no categories are selected', function() {
      const html = renderToStaticMarkup(
        KindCategoriesEditorListHelper.renderCategories([], noop)
      );

      expect(html).toContain('No categories selected.');
      expect(html).not.toContain('badge');
    });
  });
});
