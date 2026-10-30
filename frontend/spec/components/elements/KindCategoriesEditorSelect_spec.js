import { renderToStaticMarkup } from 'react-dom/server';
import KindCategoriesEditorSelect from '../../../assets/js/components/elements/KindCategoriesEditorSelect.jsx';
import { noop } from '../../support/noop.js';

describe('KindCategoriesEditorSelect', function() {
  const categories = [{ slug: 'books', name: 'Books' }, { slug: 'games', name: 'Games' }];
  const buildProps = (overrides = {}) => ({
    categories,
    selectedSlug: '',
    onSelectChange: noop,
    onAddCategory: noop,
    ...overrides,
  });

  it('renders a select with all available categories', function() {
    const html = renderToStaticMarkup(KindCategoriesEditorSelect(buildProps()));

    expect(html).toContain('Add a Category');
    expect(html).toContain('id="kind-new-category-select"');
    expect(html).toContain('Books');
    expect(html).toContain('Games');
    expect(html).toContain('Select a category');
  });

  it('renders an Add button', function() {
    const html = renderToStaticMarkup(KindCategoriesEditorSelect(buildProps()));

    expect(html).toContain('>Add<');
    expect(html).toContain('btn-success');
  });

  it('marks the selected slug as selected', function() {
    const html = renderToStaticMarkup(KindCategoriesEditorSelect(buildProps({ selectedSlug: 'games' })));

    expect(html).toContain('<option value="games" selected="">Games</option>');
  });
});
