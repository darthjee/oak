import Categories from '../../../assets/js/components/pages/Categories.jsx';
import { renderComponent } from '../../support/factories.js';

describe('Categories', function() {
  it('renders loading state on first render', function() {
    const html = renderComponent(Categories);

    expect(html).toContain('Loading categories...');
  });
});
