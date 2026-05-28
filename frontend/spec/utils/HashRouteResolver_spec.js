import HashRouteResolver from '../../assets/js/utils/HashRouteResolver.js';

describe('HashRouteResolver', function() {
  describe('#getPage', function() {
    it('returns "categoryItemEdit" for category item edit routes', function() {
      const resolver = new HashRouteResolver(() => '#/categories/project/items/35/edit');

      expect(resolver.getPage()).toBe('categoryItemEdit');
    });

    it('returns "categoryItem" for category item routes', function() {
      const resolver = new HashRouteResolver(() => '#/categories/project/items/35');

      expect(resolver.getPage()).toBe('categoryItem');
    });

    it('returns "categoryItems" for category items routes', function() {
      const resolver = new HashRouteResolver(() => '#/categories/project/items?page=2&per_page=10');

      expect(resolver.getPage()).toBe('categoryItems');
    });

    it('returns "categories" for categories routes', function() {
      const resolver = new HashRouteResolver(() => '#/categories');

      expect(resolver.getPage()).toBe('categories');
    });

    it('returns "categories" for categories routes with query params', function() {
      const resolver = new HashRouteResolver(() => '#/categories?page=2&per_page=10');

      expect(resolver.getPage()).toBe('categories');
    });

    it('returns "kinds" for kinds routes', function() {
      const resolver = new HashRouteResolver(() => '#/kinds/');

      expect(resolver.getPage()).toBe('kinds');
    });

    it('returns "kinds" for kinds routes with query params', function() {
      const resolver = new HashRouteResolver(() => '#/kinds?page=2&per_page=10');

      expect(resolver.getPage()).toBe('kinds');
    });

    it('returns "home" for unrecognized routes', function() {
      const resolver = new HashRouteResolver(() => '#/other');

      expect(resolver.getPage()).toBe('home');
    });
  });

  describe('#getPaginationParams', function() {
    it('extracts page and per_page params from hash query', function() {
      const resolver = new HashRouteResolver(() => '#/categories?page=3&per_page=12');

      expect(resolver.getPaginationParams().toString()).toBe('page=3&per_page=12');
    });

    it('returns only pagination params from hash query', function() {
      const resolver = new HashRouteResolver(() => '#/categories?page=2&foo=bar&per_page=8');

      expect(resolver.getPaginationParams().toString()).toBe('page=2&per_page=8');
    });

    it('returns empty params when hash has no query', function() {
      const resolver = new HashRouteResolver(() => '#/categories');

      expect(resolver.getPaginationParams().toString()).toBe('');
    });
  });
});
