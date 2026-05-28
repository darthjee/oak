import Router from '../../assets/js/utils/Router.js';

describe('Router', function() {
  describe('instance methods', function() {
    let router;

    beforeEach(function() {
      router = new Router();
    });

    describe('#register and #resolve', function() {
      it('resolves a registered exact route', function() {
        router.register('/categories', 'categories');

        expect(router.resolve('/categories')).toBe('categories');
      });

      it('resolves a route with a trailing slash', function() {
        router.register('/categories', 'categories');

        expect(router.resolve('/categories/')).toBe('categories');
      });

      it('resolves a route with a slug param', function() {
        router.register('/categories/:slug/items', 'categoryItems');

        expect(router.resolve('/categories/project/items')).toBe('categoryItems');
      });

      it('resolves a route with multiple params', function() {
        router.register('/categories/:slug/items/:id', 'categoryItem');

        expect(router.resolve('/categories/project/items/42')).toBe('categoryItem');
      });

      it('returns "home" for unmatched routes', function() {
        expect(router.resolve('/unknown')).toBe('home');
      });

      it('matches routes in registration order', function() {
        router.register('/categories/:slug/items/:id', 'categoryItem');
        router.register('/categories/:slug/items', 'categoryItems');

        expect(router.resolve('/categories/project/items/42')).toBe('categoryItem');
        expect(router.resolve('/categories/project/items')).toBe('categoryItems');
      });

      it('does not match a partial path', function() {
        router.register('/categories', 'categories');

        expect(router.resolve('/categories/extra')).toBe('home');
      });
    });
  });

  describe('class methods', function() {
    beforeEach(function() {
      Router.reset();
    });

    afterEach(function() {
      Router.reset();
    });

    describe('.register and .resolve', function() {
      it('resolves a registered route', function() {
        Router.register('/categories', 'categories');

        expect(Router.resolve('/categories')).toBe('categories');
      });

      it('creates the registry on first call', function() {
        Router.register('/kinds', 'kinds');

        expect(Router.resolve('/kinds')).toBe('kinds');
      });

      it('resolves a route with a slug param', function() {
        Router.register('/categories/:slug/items', 'categoryItems');

        expect(Router.resolve('/categories/project/items')).toBe('categoryItems');
      });

      it('returns "home" for unmatched routes', function() {
        expect(Router.resolve('/unknown')).toBe('home');
      });

      it('delegates to a shared registry instance', function() {
        Router.register('/categories', 'categories');
        Router.register('/kinds', 'kinds');

        expect(Router.resolve('/categories')).toBe('categories');
        expect(Router.resolve('/kinds')).toBe('kinds');
      });
    });

    describe('.extractParams', function() {
      it('extracts params from a hash route', function() {
        expect(Router.extractParams('/categories/:slug/items/:id', '#/categories/project/items/42?page=2')).toEqual({
          slug: 'project',
          id: '42',
        });
      });

      it('returns empty object when route does not match', function() {
        expect(Router.extractParams('/categories/:slug/items/:id', '#/categories/project/items')).toEqual({});
      });
    });
  });
});
