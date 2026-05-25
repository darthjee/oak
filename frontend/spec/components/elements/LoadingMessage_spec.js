import { renderToStaticMarkup } from 'react-dom/server';
import LoadingMessage from '../../../assets/js/components/elements/LoadingMessage.jsx';

describe('LoadingMessage', function() {
  it('renders a muted message inside the default container', function() {
    const html = renderToStaticMarkup(LoadingMessage({ message: 'Loading category item...' }));

    expect(html).toContain('container mt-4');
    expect(html).toContain('text-muted');
    expect(html).toContain('Loading category item...');
  });
});
