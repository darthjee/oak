import Authorizations from '../../../assets/js/components/pages/Authorizations.jsx';
import { renderComponent } from '../../support/factories.js';

describe('Authorizations', function() {
  it('renders the Authorizations heading', function() {
    const html = renderComponent(Authorizations);

    expect(html).toContain('<h1>Authorizations</h1>');
  });
});
