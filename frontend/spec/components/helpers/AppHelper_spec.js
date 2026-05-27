import AppHelper from '../../../assets/js/components/helpers/AppHelper.jsx';
import { renderStatic } from '../../support/factories.js';

describe('AppHelper', function() {
  const renderPage = (page) => renderStatic(AppHelper.render(page));

  describe('.render', function() {
    it('renders the header', function() {
      const html = renderPage('home');

      expect(html).toContain('Oak');
    });

    it('renders the Categories component for "home" page', function() {
      const html = renderPage('home');

      expect(html).toContain('Loading categories...');
    });

    it('does not render the home placeholder for "home" page', function() {
      const html = renderPage('home');

      expect(html).not.toContain('placeholder');
    });

    it('does not render CategoryItems for "home" page', function() {
      const html = renderPage('home');

      expect(html).not.toContain('Loading category items...');
    });

    it('renders the Categories component for "categories" page', function() {
      const html = renderPage('categories');

      expect(html).toContain('Loading categories...');
    });

    it('does not render the home placeholder for "categories" page', function() {
      const html = renderPage('categories');

      expect(html).not.toContain('placeholder');
    });

    it('renders the CategoryItems component for "categoryItems" page', function() {
      const html = renderPage('categoryItems');

      expect(html).toContain('Loading category items...');
    });

    it('renders the CategoryItem component for "categoryItem" page', function() {
      const html = renderPage('categoryItem');

      expect(html).toContain('Loading category item...');
    });

    it('renders the Kinds component for "kinds" page', function() {
      const html = renderPage('kinds');

      expect(html).toContain('Loading kinds...');
    });
  });
});
