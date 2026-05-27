import Kinds from '../../../assets/js/components/pages/Kinds.jsx';
import { renderComponent } from '../../support/factories.js';

describe('Kinds', function() {
  it('renders loading state on first render', function() {
    const html = renderComponent(Kinds);

    expect(html).toContain('Loading kinds...');
  });
});
