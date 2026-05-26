import { renderToStaticMarkup } from 'react-dom/server';
import CategoryItemLink from '../../../assets/js/components/elements/CategoryItemLink.jsx';

describe('CategoryItemLink', function() {
  it('renders one link list item', function() {
    const html = renderToStaticMarkup(
      CategoryItemLink({
        link: { id: 1, text: 'GitHub', url: 'https://github.com/darthjee/oak' },
      })
    );

    expect(html).toContain('list-group-item');
    expect(html).toContain('https://github.com/darthjee/oak');
    expect(html).toContain('GitHub');
    expect(html).toContain('target="_blank"');
  });

  it('falls back to URL when link text is missing', function() {
    const html = renderToStaticMarkup(
      CategoryItemLink({
        link: { id: 1, text: '', url: 'https://github.com/darthjee/oak' },
      })
    );

    expect(html).toContain('>https://github.com/darthjee/oak<');
  });
});
