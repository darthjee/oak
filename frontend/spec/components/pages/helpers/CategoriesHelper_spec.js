import CategoriesHelper from '../../../../assets/js/components/pages/helpers/CategoriesHelper.jsx';
import { renderStatic } from '../../../support/factories.js';

describe('CategoriesHelper', function() {
  it('renders loading state', function() {
    const html = renderStatic(CategoriesHelper.renderLoading());

    expect(html).toContain('Loading categories...');
  });

  it('renders error state', function() {
    const html = renderStatic(CategoriesHelper.renderError('network failure'));

    expect(html).toContain('Error: network failure');
  });

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

  it('renders empty grid when no categories', function() {
    const html = renderStatic(CategoriesHelper.render([], false, { page: 1, pages: 1, perPage: 10 }));

    expect(html).toContain('container mt-4');
    expect(html).toContain('row');
    expect(html).not.toContain('card');
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

  it('renders pagination below the categories list', function() {
    const html = renderStatic(
      CategoriesHelper.render([], false, { page: 2, pages: 4, perPage: 8 })
    );

    expect(html).toContain('/#/categories?page=1&amp;per_page=8');
    expect(html).toContain('/#/categories?page=2&amp;per_page=8');
    expect(html).toContain('/#/categories?page=3&amp;per_page=8');
  });
});
