import { renderToStaticMarkup } from 'react-dom/server';
import CategoryItemLinks from '../../../assets/js/components/elements/CategoryItemLinks.jsx';

describe('CategoryItemLinks', function() {
  it('renders links section when links are present', function() {
    const html = renderToStaticMarkup(
      CategoryItemLinks({
        links: [{ id: 1, text: 'GitHub', url: 'https://github.com/darthjee/oak' }],
      })
    );

    expect(html).toContain('Links');
    expect(html).toContain('https://github.com/darthjee/oak');
    expect(html).toContain('GitHub');
    expect(html).toContain('target="_blank"');
  });

  it('returns empty markup when links are empty', function() {
    const html = renderToStaticMarkup(CategoryItemLinks({ links: [] }));

    expect(html).toBe('');
  });
});
