import { renderToStaticMarkup } from 'react-dom/server';
import KindCategoriesEditor from '../../../assets/js/components/elements/KindCategoriesEditor.jsx';
import KindCategoriesEditorList from '../../../assets/js/components/elements/KindCategoriesEditorList.jsx';
import KindCategoriesEditorSelect from '../../../assets/js/components/elements/KindCategoriesEditorSelect.jsx';
import { noop } from '../../support/noop.js';

describe('KindCategoriesEditor', function() {
  const allCategories = [
    { slug: 'books', name: 'Books' },
    { slug: 'games', name: 'Games' },
  ];
  const buildProps = (overrides = {}) => ({
    allCategories,
    selectedCategories: [{ slug: 'books', name: 'Books' }],
    selectedSlug: 'games',
    onSelectChange: jasmine.createSpy('onSelectChange'),
    onAddCategory: jasmine.createSpy('onAddCategory'),
    onRemoveCategory: jasmine.createSpy('onRemoveCategory'),
    ...overrides,
  });

  it('renders the select and the selected categories list', function() {
    const html = renderToStaticMarkup(KindCategoriesEditor(buildProps()));

    expect(html).toContain('Add a Category');
    expect(html).toContain('Games');
    expect(html).toContain('Categories');
    expect(html).toContain('badge');
  });

  it('wires props into the select subcomponent', function() {
    const props = buildProps();
    const element = KindCategoriesEditor(props);
    const [select] = element.props.children;

    expect(select.type).toBe(KindCategoriesEditorSelect);
    expect(select.props.categories).toBe(allCategories);
    expect(select.props.selectedSlug).toEqual('games');
    expect(select.props.onSelectChange).toBe(props.onSelectChange);
    expect(select.props.onAddCategory).toBe(props.onAddCategory);
  });

  it('wires props into the list subcomponent', function() {
    const props = buildProps();
    const element = KindCategoriesEditor(props);
    const [, list] = element.props.children;

    expect(list.type).toBe(KindCategoriesEditorList);
    expect(list.props.categories).toBe(props.selectedCategories);
    expect(list.props.onRemoveCategory).toBe(props.onRemoveCategory);
  });

  it('renders empty message when nothing is selected', function() {
    const html = renderToStaticMarkup(
      KindCategoriesEditor(buildProps({ selectedCategories: [], onRemoveCategory: noop }))
    );

    expect(html).toContain('No categories selected.');
  });
});
