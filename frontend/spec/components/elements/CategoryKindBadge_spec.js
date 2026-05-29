import { renderToStaticMarkup } from 'react-dom/server';
import CategoryKindBadge from '../../../assets/js/components/elements/CategoryKindBadge.jsx';

describe('CategoryKindBadge', function() {
  const kind = { slug: 'code', name: 'Code' };

  it('renders the kind name', function() {
    const html = renderToStaticMarkup(CategoryKindBadge({ kind, onRemove: () => {} }));

    expect(html).toContain('Code');
    expect(html).toContain('badge');
  });

  it('renders a remove button', function() {
    const html = renderToStaticMarkup(CategoryKindBadge({ kind, onRemove: () => {} }));

    expect(html).toContain('x');
    expect(html).toContain('btn-danger');
  });
});
