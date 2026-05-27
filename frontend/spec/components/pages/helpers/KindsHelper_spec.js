import { renderToStaticMarkup } from 'react-dom/server';
import KindsHelper from '../../../../assets/js/components/pages/helpers/KindsHelper.jsx';

describe('KindsHelper', function() {
  it('renders loading state', function() {
    const html = renderToStaticMarkup(KindsHelper.renderLoading());

    expect(html).toContain('Loading kinds...');
  });

  it('renders error state', function() {
    const html = renderToStaticMarkup(KindsHelper.renderError('network failure'));

    expect(html).toContain('Error: network failure');
  });

  it('renders kind cards without links section', function() {
    const kinds = [
      { slug: 'book', name: 'Book', snap_url: 'http://example.com/book.png' },
    ];
    const html = renderToStaticMarkup(KindsHelper.render(kinds, { page: 1, pages: 1, perPage: 10 }));

    expect(html).toContain('Book');
    expect(html).toContain('/#/kinds/book');
    expect(html).toContain('http://example.com/book.png');
    expect(html).not.toContain('card-footer');
  });

  it('renders empty grid when no kinds', function() {
    const html = renderToStaticMarkup(KindsHelper.render([], { page: 1, pages: 1, perPage: 10 }));

    expect(html).toContain('container mt-4');
    expect(html).toContain('row');
    expect(html).not.toContain('card');
  });

  it('renders multiple kind cards', function() {
    const kinds = [
      { slug: 'book', name: 'Book', snap_url: null },
      { slug: 'game', name: 'Game', snap_url: 'http://example.com/game.png' },
    ];
    const html = renderToStaticMarkup(KindsHelper.render(kinds, { page: 1, pages: 1, perPage: 10 }));

    expect(html).toContain('Book');
    expect(html).toContain('Game');
    expect(html).toContain('/#/kinds/book');
    expect(html).toContain('/#/kinds/game');
    expect(html).toContain('http://example.com/game.png');
  });

  it('renders pagination below the kinds list', function() {
    const html = renderToStaticMarkup(
      KindsHelper.render([], { page: 2, pages: 4, perPage: 8 })
    );

    expect(html).toContain('/#/kinds?page=1&amp;per_page=8');
    expect(html).toContain('/#/kinds?page=2&amp;per_page=8');
    expect(html).toContain('/#/kinds?page=3&amp;per_page=8');
  });
});
