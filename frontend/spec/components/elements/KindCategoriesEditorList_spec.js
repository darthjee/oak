import { renderToStaticMarkup } from 'react-dom/server';
import KindCategoriesEditorList from '../../../assets/js/components/elements/KindCategoriesEditorList.jsx';
import { noop } from '../../support/noop.js';

describe('KindCategoriesEditorList', function() {
  it('renders selected categories as removable badges', function() {
    const html = renderToStaticMarkup(
      KindCategoriesEditorList({
        categories: [{ slug: 'books', name: 'Books' }, { slug: 'games', name: 'Games' }],
        onRemoveCategory: noop,
      })
    );

    expect(html).toContain('Categories');
    expect(html).toContain('Books');
    expect(html).toContain('Games');
    expect(html).toContain('badge');
    expect(html).toContain('btn-danger');
  });

  it('renders empty message when no categories are selected', function() {
    const html = renderToStaticMarkup(
      KindCategoriesEditorList({ categories: [], onRemoveCategory: noop })
    );

    expect(html).toContain('No categories selected.');
    expect(html).not.toContain('badge');
  });
});
