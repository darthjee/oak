import PhotoMigration from '../../../assets/js/components/pages/PhotoMigration.jsx';
import { renderComponent } from '../../support/factories.js';

describe('PhotoMigration', function() {
  it('renders the logged-out message on first render', function() {
    const html = renderComponent(PhotoMigration);

    expect(html).toContain('Please log in to migrate your photos.');
    expect(html).not.toContain('<button');
  });
});
