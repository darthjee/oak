import CategoryItems from '../../../assets/js/components/pages/CategoryItems.jsx';
import { renderComponent } from '../../support/factories.js';

describe('CategoryItems', function() {
  it('renders loading state on first render', function() {
    const html = renderComponent(CategoryItems);

    expect(html).toContain('Loading category items...');
  });
});
