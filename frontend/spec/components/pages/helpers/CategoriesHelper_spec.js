import CategoriesHelper from '../../../../assets/js/components/pages/helpers/CategoriesHelper.jsx';
import { renderStatic } from '../../../support/factories.js';
import {
  itRendersEmptyGrid,
  itRendersLoadingAndErrorStates,
  itRendersPagination,
} from '../../../support/shared_examples/pageHelperExamples.js';

describe('CategoriesHelper', function() {
  itRendersLoadingAndErrorStates(CategoriesHelper, 'Loading categories...');
  itRendersEmptyGrid(() => CategoriesHelper.render([], false, { page: 1, pages: 1, perPage: 10 }));
  itRendersPagination((p) => CategoriesHelper.render([], false, p), '/#/categories');

  it('renders category cards when logged out', function() {
    const categories = [
      { slug: 'project', name: 'Project', snap_url: 'http://example.com/snap.png' },
    ];
    const html = renderStatic(CategoriesHelper.render(categories, false, { page: 1, pages: 1, perPage: 10 }));

    expect(html).toContain('Project');
    expect(html).toContain('/#/categories/project/items');
    expect(html).toContain('http://example.com/snap.png');
    expect(html).not.toContain('/#/categories/new');
  });

  it('renders New button when logged in', function() {
    const categories = [
      { slug: 'project', name: 'Project', snap_url: 'http://example.com/snap.png' },
    ];
    const html = renderStatic(CategoriesHelper.render(categories, true, { page: 1, pages: 1, perPage: 10 }));

    expect(html).toContain('/#/categories/new');
    expect(html).toContain('New');
  });

  it('renders multiple category cards', function() {
    const categories = [
      { slug: 'project', name: 'Project', snap_url: null },
      { slug: 'miniatures', name: 'Miniatures', snap_url: 'http://example.com/mini.png' },
    ];
    const html = renderStatic(CategoriesHelper.render(categories, false, { page: 1, pages: 1, perPage: 10 }));

    expect(html).toContain('Project');
    expect(html).toContain('Miniatures');
    expect(html).toContain('/#/categories/project/items');
    expect(html).toContain('/#/categories/miniatures/items');
    expect(html).toContain('http://example.com/mini.png');
  });
});
