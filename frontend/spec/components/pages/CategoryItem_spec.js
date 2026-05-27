import CategoryItem from '../../../assets/js/components/pages/CategoryItem.jsx';
import { renderComponent } from '../../support/factories.js';

describe('CategoryItem', function() {
  it('renders loading state on first render', function() {
    const html = renderComponent(CategoryItem);

    expect(html).toContain('Loading category item...');
  });
});
