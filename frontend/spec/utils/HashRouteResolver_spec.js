import HashRouteResolver from '../../assets/js/utils/HashRouteResolver.js';

describe('HashRouteResolver', function() {
  describe('#currentHash', function() {
    it('uses the default hash provider when none is provided', function() {
      const originalWindow = global.window;
      global.window = { location: { hash: '#/kinds?page=2' } };

      try {
        const resolver = new HashRouteResolver();
        expect(resolver.currentHash()).toBe('#/kinds?page=2');
      } finally {
        global.window = originalWindow;
      }
    });

    it('returns an empty hash when window is unavailable', function() {
      const originalWindow = global.window;
      global.window = undefined;

      try {
        const resolver = new HashRouteResolver();
        expect(resolver.currentHash()).toBe('');
      } finally {
        global.window = originalWindow;
      }
    });
  });

  describe('#getPage', function() {
    it('returns "categoryItemEdit" for category item edit routes', function() {
      const resolver = new HashRouteResolver(() => '#/categories/project/items/35/edit');

      expect(resolver.getPage()).toBe('categoryItemEdit');
    });

    it('returns "categoryItemNew" for category item new routes', function() {
      const resolver = new HashRouteResolver(() => '#/categories/project/items/new');

      expect(resolver.getPage()).toBe('categoryItemNew');
    });

    it('returns "categoryItem" for category item routes', function() {
      const resolver = new HashRouteResolver(() => '#/categories/project/items/35');

      expect(resolver.getPage()).toBe('categoryItem');
    });

    it('returns "categoryItems" for category items routes', function() {
      const resolver = new HashRouteResolver(() => '#/categories/project/items?page=2&per_page=10');

      expect(resolver.getPage()).toBe('categoryItems');
    });

    it('returns "categoryNew" for category new routes', function() {
      const resolver = new HashRouteResolver(() => '#/categories/new');

      expect(resolver.getPage()).toBe('categoryNew');
    });

    it('returns "category" for category routes', function() {
      const resolver = new HashRouteResolver(() => '#/categories/project?page=2&per_page=10');

      expect(resolver.getPage()).toBe('category');
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

    it('resolves routes even when hash prefix is missing', function() {
      const resolver = new HashRouteResolver(() => '/categories');

      expect(resolver.getPage()).toBe('categories');
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
