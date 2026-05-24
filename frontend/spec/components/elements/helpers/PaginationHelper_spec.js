import { renderToStaticMarkup } from 'react-dom/server';
import PaginationHelper from '../../../../assets/js/components/elements/helpers/PaginationHelper.jsx';

describe('PaginationHelper', function() {
  it('renders nothing when there is one page', function() {
    const html = renderToStaticMarkup(PaginationHelper.render(1, 1, 10, '/#/categories'));

    expect(html).toBe('');
  });

  it('renders active page, ellipsis and numbered links', function() {
    const html = renderToStaticMarkup(PaginationHelper.render(10, 20, 12, '/#/categories'));

    expect(html).toContain('pagination justify-content-center');
    expect(html).toContain('page-item active');
    expect(html).toContain('/#/categories?page=10&amp;per_page=12');
    expect(html).toContain('/#/categories?page=7&amp;per_page=12');
    expect(html).toContain('…');
  });

  it('disables previous button on first page', function() {
    const html = renderToStaticMarkup(PaginationHelper.render(1, 5, 10, '/#/categories'));

    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('«');
    expect(html).not.toContain('/#/categories?page=0&amp;per_page=10');
  });

  it('disables next button on last page', function() {
    const html = renderToStaticMarkup(PaginationHelper.render(5, 5, 10, '/#/categories'));

    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('»');
    expect(html).not.toContain('/#/categories?page=6&amp;per_page=10');
  });

  it('normalizes invalid pagination values', function() {
    const html = renderToStaticMarkup(PaginationHelper.render(0, 3, 'x', '/#/categories'));

    expect(html).toContain('/#/categories?page=1&amp;per_page=10');
  });
});
