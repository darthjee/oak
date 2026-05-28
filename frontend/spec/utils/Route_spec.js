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

  describe('#params', function() {
    it('extracts params from a matching route', function() {
      const route = new Route('/categories/:slug/items/:id', 'categoryItem');

      expect(route.params('/categories/project/items/42')).toEqual({ slug: 'project', id: '42' });
    });

    it('returns empty object when route does not match', function() {
      const route = new Route('/categories/:slug/items/:id', 'categoryItem');

      expect(route.params('/categories/project/items')).toEqual({});
    });
  });
});
