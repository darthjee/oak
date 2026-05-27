import { renderStatic } from '../factories.js';

/**
 * Shared examples for page helper classes that expose renderLoading() and renderError().
 *
 * Usage:
 *   itRendersLoadingAndErrorStates(MyHelper, 'Loading my things...');
 */
export const itRendersLoadingAndErrorStates = (Helper, loadingText) => {
  it('renders loading state', function() {
    const html = renderStatic(Helper.renderLoading());

    expect(html).toContain(loadingText);
  });

  it('renders error state', function() {
    const html = renderStatic(Helper.renderError('network failure'));

    expect(html).toContain('Error: network failure');
  });
};

/**
 * Shared example for list helpers that render an empty grid when there are no items.
 *
 * @param {Function} renderEmptyFn - zero-argument function that calls the helper's render
 *   method with an empty collection and returns JSX.
 *
 * Usage:
 *   itRendersEmptyGrid(() => MyHelper.render([], { page: 1, pages: 1, perPage: 10 }));
 */
export const itRendersEmptyGrid = (renderEmptyFn) => {
  it('renders empty grid when no items', function() {
    const html = renderStatic(renderEmptyFn());

    expect(html).toContain('container mt-4');
    expect(html).toContain('row');
    expect(html).not.toContain('card');
  });
};

/**
 * Shared example for list helpers that include a pagination component.
 *
 * @param {Function} renderWithPaginationFn - function that accepts a pagination object
 *   and returns JSX by calling the helper's render method with an empty collection.
 * @param {string} basePath - the base URL path expected in pagination links (e.g. '/#/categories').
 *
 * Usage:
 *   itRendersPagination((p) => MyHelper.render([], p), '/#/my-path');
 */
export const itRendersPagination = (renderWithPaginationFn, basePath) => {
  it('renders pagination', function() {
    const html = renderStatic(renderWithPaginationFn({ page: 2, pages: 4, perPage: 8 }));

    expect(html).toContain(`${basePath}?page=1&amp;per_page=8`);
    expect(html).toContain(`${basePath}?page=2&amp;per_page=8`);
    expect(html).toContain(`${basePath}?page=3&amp;per_page=8`);
  });
};
