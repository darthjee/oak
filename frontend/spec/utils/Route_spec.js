import Route from '../../assets/js/utils/Route.js';

describe('Route', function() {
  describe('#matches', function() {
    it('matches an exact path', function() {
      const route = new Route('/categories', 'categories');

      expect(route.matches('/categories')).toBe(true);
    });

    it('matches a path with a trailing slash', function() {
      const route = new Route('/categories', 'categories');

      expect(route.matches('/categories/')).toBe(true);
    });

    it('matches a path with a :param segment', function() {
      const route = new Route('/categories/:slug/items', 'categoryItems');

      expect(route.matches('/categories/project/items')).toBe(true);
    });

    it('matches a path with multiple :param segments', function() {
      const route = new Route('/categories/:slug/items/:id', 'categoryItem');

      expect(route.matches('/categories/project/items/42')).toBe(true);
    });

    it('does not match a partial path', function() {
      const route = new Route('/categories', 'categories');

      expect(route.matches('/categories/extra')).toBe(false);
    });

    it('does not match an unrelated path', function() {
      const route = new Route('/categories', 'categories');

      expect(route.matches('/kinds')).toBe(false);
    });
  });

  describe('#page', function() {
    it('returns the page identifier', function() {
      const route = new Route('/categories', 'categories');

      expect(route.page).toBe('categories');
    });
  });
});
