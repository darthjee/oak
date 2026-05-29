import AppHelper from '../../../assets/js/components/helpers/AppHelper.jsx';
import { renderStatic } from '../../support/factories.js';

describe('AppHelper', function() {
  const renderPage = (page, hash) => renderStatic(AppHelper.render(page, hash));

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

    it('renders the Category component for "category" page', function() {
      const html = renderPage('category');

      expect(html).toContain('Loading category...');
    });

    it('renders the CategoryEdit component for "categoryEdit" page', function() {
      const html = renderPage('categoryEdit');

      expect(html).toContain('Loading category new form...');
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

    it('renders the CategoryItemEdit component for "categoryItemEdit" page', function() {
      const html = renderPage('categoryItemEdit');

      expect(html).toContain('Loading category item edit...');
    });

    it('renders the CategoryItemNew component for "categoryItemNew" page', function() {
      const html = renderPage('categoryItemNew');

      expect(html).toContain('Loading category item edit...');
    });

    it('renders the Kinds component for "kinds" page', function() {
      const html = renderPage('kinds');

      expect(html).toContain('Loading kinds...');
    });

    it('uses the provided hash as the page fragment key', function() {
      const element = AppHelper.render('home', '#/categories?page=2&per_page=10');

      expect(element.props.children[1].key).toBe('#/categories?page=2&per_page=10');
    });
  });
});
