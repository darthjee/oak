import CategoryItemEditHelper from '../../../../assets/js/components/pages/helpers/CategoryItemEditHelper.jsx';
import { renderStatic } from '../../../support/factories.js';
import { itRendersLoadingAndErrorStates } from '../../../support/shared_examples/pageHelperExamples.js';

describe('CategoryItemEditHelper', function() {
  const item = {
    id: 35,
    name: 'Oak',
    description: 'A project item',
    kind_slug: 'code',
    category: { slug: 'project', name: 'Project' },
    links: [{ id: 1, text: 'GitHub', url: 'https://github.com/darthjee/oak' }],
  };
  const kinds = [{ slug: 'code', name: 'Code' }, { slug: 'docs', name: 'Docs' }];

  itRendersLoadingAndErrorStates(CategoryItemEditHelper, 'Loading category item edit...');

  it('renders edit form fields, links editor and actions', function() {
    const html = renderStatic(
      CategoryItemEditHelper.render(
        item,
        kinds,
        false,
        () => {},
        () => {},
        () => {},
        () => {},
        () => {}
      )
    );

    expect(html).toContain('/#/categories/project/items/35');
    expect(html).toContain('Save');
    expect(html).toContain('Name');
    expect(html).not.toContain('Category');
    expect(html).toContain('Kind');
    expect(html).toContain('Description');
    expect(html).toContain('Code');
    expect(html).toContain('Links');
    expect(html).toContain('Add link');
  });
});
