import CategoryItemsHelper from '../../../../assets/js/components/pages/helpers/CategoryItemsHelper.jsx';
import { renderStatic } from '../../../support/factories.js';
import {
  itRendersLoadingAndErrorStates,
  itRendersPagination,
} from '../../../support/shared_examples/pageHelperExamples.js';

describe('CategoryItemsHelper', function() {
  itRendersLoadingAndErrorStates(CategoryItemsHelper, 'Loading category items...');
  itRendersPagination(
    (p) => CategoryItemsHelper.render([], false, p, 'project'),
    '/#/categories/project/items'
  );

  it('renders category item cards when logged out', function() {
    const items = [
      {
        id: 35,
        name: 'Oak',
        snap_url: 'http://example.com/oak.png',
        links: [
          { id: 35, text: 'Github', url: 'https://github.com/darthjee/oak' },
          { id: 36, text: 'Docs', url: 'https://example.com/docs' },
        ],
      },
    ];
    const html = renderStatic(
      CategoryItemsHelper.render(items, false, { page: 1, pages: 1, perPage: 10 }, 'project')
    );

    expect(html).toContain('Oak');
    expect(html).toContain('/#/categories/project/items/35');
    expect(html).toContain('http://example.com/oak.png');
    expect(html).toContain('https://github.com/darthjee/oak');
    expect(html).toContain('Github');
    expect(html).toContain('https://example.com/docs');
    expect(html).toContain('Docs');
    expect(html).not.toContain('/#/categories/project/items/new');
    expect(html).not.toContain('/#/categories/project/edit');
  });

  it('does not render links when item has no links', function() {
    const items = [{ id: 35, name: 'Oak', snap_url: null, links: [] }];
    const html = renderStatic(
      CategoryItemsHelper.render(items, false, { page: 1, pages: 1, perPage: 10 }, 'project')
    );

    expect(html).not.toContain('External link');
    expect(html).not.toContain('target="_blank"');
  });

  it('renders New and Edit buttons when logged in', function() {
    const items = [{ id: 35, name: 'Oak', snap_url: null, links: [] }];
    const html = renderStatic(
      CategoryItemsHelper.render(items, true, { page: 1, pages: 1, perPage: 10 }, 'project')
    );

    expect(html).toContain('/#/categories/project/items/new');
    expect(html).toContain('/#/categories/project/edit');
    expect(html).toContain('New');
    expect(html).toContain('Edit');
  });
});
