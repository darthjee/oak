import KindsHelper from '../../../../assets/js/components/pages/helpers/KindsHelper.jsx';
import { renderStatic } from '../../../support/factories.js';
import {
  itRendersEmptyGrid,
  itRendersLoadingAndErrorStates,
  itRendersPagination,
} from '../../../support/shared_examples/pageHelperExamples.js';

describe('KindsHelper', function() {
  itRendersLoadingAndErrorStates(KindsHelper, 'Loading kinds...');
  itRendersEmptyGrid(() => KindsHelper.render([], false, { page: 1, pages: 1, perPage: 10 }));
  itRendersPagination((p) => KindsHelper.render([], false, p), '/#/kinds');

  it('renders kind cards without links section', function() {
    const kinds = [
      { slug: 'book', name: 'Book', snap_url: 'http://example.com/book.png' },
    ];
    const html = renderStatic(KindsHelper.render(kinds, false, { page: 1, pages: 1, perPage: 10 }));

    expect(html).toContain('Book');
    expect(html).toContain('/#/kinds/book');
    expect(html).toContain('http://example.com/book.png');
    expect(html).not.toContain('card-footer');
  });

  it('renders multiple kind cards', function() {
    const kinds = [
      { slug: 'book', name: 'Book', snap_url: null },
      { slug: 'game', name: 'Game', snap_url: 'http://example.com/game.png' },
    ];
    const html = renderStatic(KindsHelper.render(kinds, false, { page: 1, pages: 1, perPage: 10 }));

    expect(html).toContain('Book');
    expect(html).toContain('Game');
    expect(html).toContain('/#/kinds/book');
    expect(html).toContain('/#/kinds/game');
    expect(html).toContain('http://example.com/game.png');
  });

  it('does not render the New button when logged out', function() {
    const html = renderStatic(KindsHelper.render([], false, { page: 1, pages: 1, perPage: 10 }));

    expect(html).not.toContain('/#/kinds/new');
    expect(html).not.toContain('>New<');
  });

  it('renders the New button when logged in', function() {
    const html = renderStatic(KindsHelper.render([], true, { page: 1, pages: 1, perPage: 10 }));

    expect(html).toContain('href="/#/kinds/new"');
    expect(html).toContain('btn btn-primary mb-3');
    expect(html).toContain('>New<');
  });
});
