import CategoryItemHelper from '../../../../assets/js/components/pages/helpers/CategoryItemHelper.jsx';
import { renderStatic } from '../../../support/factories.js';
import { itRendersLoadingAndErrorStates } from '../../../support/shared_examples/pageHelperExamples.js';

describe('CategoryItemHelper', function() {
  const item = {
    id: 35,
    name: 'Oak',
    description: 'A project item',
    category: { slug: 'project', name: 'Project' },
    kind: { slug: 'code', name: 'Code' },
    links: [{ id: 1, text: 'GitHub', url: 'https://github.com/darthjee/oak' }],
    photos: [{ photo_url: 'http://example.com/oak-1.png', snap_url: 'http://example.com/oak-1-small.png' }],
  };

  itRendersLoadingAndErrorStates(CategoryItemHelper, 'Loading category item...');

  it('renders back and edit links when logged in', function() {
    const html = renderStatic(CategoryItemHelper.render(item, true));

    expect(html).toContain('/#/categories/project/items');
    expect(html).toContain('/#/categories/project/items/35/edit');
    expect(html).toContain('Back');
    expect(html).toContain('Edit');
  });

  it('hides edit link when not logged in', function() {
    const html = renderStatic(CategoryItemHelper.render(item, false));

    expect(html).toContain('/#/categories/project/items');
    expect(html).not.toContain('/#/categories/project/items/35/edit');
  });

  it('renders info card fields', function() {
    const html = renderStatic(CategoryItemHelper.render(item, false));

    expect(html).toContain('Oak');
    expect(html).toContain('Category:');
    expect(html).toContain('Project');
    expect(html).toContain('Kind:');
    expect(html).toContain('Code');
    expect(html).toContain('A project item');
  });

  it('renders links section when links are present', function() {
    const html = renderStatic(CategoryItemHelper.render(item, false));

    expect(html).toContain('Links');
    expect(html).toContain('https://github.com/darthjee/oak');
    expect(html).toContain('GitHub');
    expect(html).toContain('target="_blank"');
  });

  it('does not render links section when links are empty', function() {
    const html = renderStatic(CategoryItemHelper.render({ ...item, links: [] }, false));

    expect(html).not.toContain('Links');
    expect(html).not.toContain('target="_blank"');
  });

  it('renders carousel when photos are present', function() {
    const html = renderStatic(CategoryItemHelper.render(item, false));

    expect(html).toContain('Photos');
    expect(html).toContain('http://example.com/oak-1.png');
    expect(html).toContain('carousel');
  });

  it('does not render carousel when photos are empty', function() {
    const html = renderStatic(CategoryItemHelper.render({ ...item, photos: [] }, false));

    expect(html).not.toContain('Photos');
    expect(html).not.toContain('carousel');
  });
});
