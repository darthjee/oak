import { renderToStaticMarkup } from 'react-dom/server';
import AppHelper from '../../../assets/js/components/helpers/AppHelper.jsx';

describe('AppHelper', function() {
  describe('.render', function() {
    it('renders the header', function() {
      const html = renderToStaticMarkup(AppHelper.render('home'));

      expect(html).toContain('Oak');
    });

    it('renders the home placeholder for "home" page', function() {
      const html = renderToStaticMarkup(AppHelper.render('home'));

      expect(html).toContain('placeholder');
    });

    it('does not render Categories for "home" page', function() {
      const html = renderToStaticMarkup(AppHelper.render('home'));

      expect(html).not.toContain('Loading categories...');
    });

    it('does not render CategoryItems for "home" page', function() {
      const html = renderToStaticMarkup(AppHelper.render('home'));

      expect(html).not.toContain('Loading category items...');
    });

    it('renders the Categories component for "categories" page', function() {
      const html = renderToStaticMarkup(AppHelper.render('categories'));

      expect(html).toContain('Loading categories...');
    });

    it('does not render the home placeholder for "categories" page', function() {
      const html = renderToStaticMarkup(AppHelper.render('categories'));

      expect(html).not.toContain('placeholder');
    });

    it('renders the CategoryItems component for "categoryItems" page', function() {
      const html = renderToStaticMarkup(AppHelper.render('categoryItems'));

      expect(html).toContain('Loading category items...');
    });

    it('renders the CategoryItem component for "categoryItem" page', function() {
      const html = renderToStaticMarkup(AppHelper.render('categoryItem'));

      expect(html).toContain('Loading category item...');
    });
  });
});
