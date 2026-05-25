import { renderToStaticMarkup } from 'react-dom/server';
import Alert from '../../../assets/js/components/elements/Alert.jsx';

describe('Alert', function() {
  it('renders a danger alert by default', function() {
    const html = renderToStaticMarkup(Alert({ message: 'Failure' }));

    expect(html).toContain('alert-danger');
    expect(html).toContain('Failure');
  });

  it('renders the provided variant', function() {
    const html = renderToStaticMarkup(Alert({ message: 'Heads up', variant: 'warning' }));

    expect(html).toContain('alert-warning');
    expect(html).toContain('Heads up');
  });
});
