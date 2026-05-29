import CategoryHelper from '../../../../assets/js/components/pages/helpers/CategoryHelper.jsx';
import { renderStatic } from '../../../support/factories.js';
import { itRendersLoadingAndErrorStates } from '../../../support/shared_examples/pageHelperExamples.js';

describe('CategoryHelper', function() {
  const category = {
    slug: 'project',
    name: 'Project',
    snap_url: 'http://example.com/project.png',
    kinds: [
      { slug: 'code', name: 'Code' },
      { slug: 'hardware', name: 'Hardware' },
    ],
  };

  itRendersLoadingAndErrorStates(CategoryHelper, 'Loading category...');

  it('renders actions and category data', function() {
    const html = renderStatic(CategoryHelper.render(category));

    expect(html).toContain('/#/categories');
    expect(html).toContain('/#/categories/project/items');
    expect(html).toContain('Back');
    expect(html).toContain('Items');
    expect(html).toContain('Project');
    expect(html).toContain('http://example.com/project.png');
  });

  it('renders connected kinds as badges', function() {
    const html = renderStatic(CategoryHelper.render(category));

    expect(html).toContain('Kinds');
    expect(html).toContain('Code');
    expect(html).toContain('Hardware');
    expect(html).toContain('badge');
  });

  it('renders empty kinds message when category has no kinds', function() {
    const html = renderStatic(CategoryHelper.render({ ...category, kinds: [] }));

    expect(html).toContain('No kinds connected.');
  });
});
