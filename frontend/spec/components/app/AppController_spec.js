import AppController from '../../../assets/js/components/AppController.js';

describe('AppController', function() {
  describe('#getPage', function() {
    it('returns "categoryItem" for #/categories/:slug/items/:id', function() {
      const controller = new AppController(null, null, () => '#/categories/project/items/35');

      expect(controller.getPage()).toBe('categoryItem');
    });

    it('returns "categoryItem" for #/categories/:slug/items/:id with query params', function() {
      const controller = new AppController(
        null,
        null,
        () => '#/categories/project/items/35?foo=bar'
      );

      expect(controller.getPage()).toBe('categoryItem');
    });

    it('returns "categoryItems" for #/categories/:slug/items', function() {
      const controller = new AppController(null, null, () => '#/categories/project/items');

      expect(controller.getPage()).toBe('categoryItems');
    });

    it('returns "categoryItems" for #/categories/:slug/items with query params', function() {
      const controller = new AppController(
        null,
        null,
        () => '#/categories/project/items?page=2&per_page=10'
      );

      expect(controller.getPage()).toBe('categoryItems');
    });

    it('returns "categories" for #/categories', function() {
      const controller = new AppController(null, null, () => '#/categories');

      expect(controller.getPage()).toBe('categories');
    });

    it('returns "categories" for #/categories/', function() {
      const controller = new AppController(null, null, () => '#/categories/');

      expect(controller.getPage()).toBe('categories');
    });

    it('returns "kinds" for #/kinds', function() {
      const controller = new AppController(null, null, () => '#/kinds');

      expect(controller.getPage()).toBe('kinds');
    });

    it('returns "kinds" for #/kinds/', function() {
      const controller = new AppController(null, null, () => '#/kinds/');

      expect(controller.getPage()).toBe('kinds');
    });

    it('returns "home" for empty hash', function() {
      const controller = new AppController(null, null, () => '');

      expect(controller.getPage()).toBe('home');
    });

    it('returns "home" for unrecognised hash', function() {
      const controller = new AppController(null, null, () => '#/other');

      expect(controller.getPage()).toBe('home');
    });
  });

  describe('#renderPage', function() {
    it('delegates to AppHelper and returns a React element', function() {
      const controller = new AppController(null, null, () => '');
      const element = controller.renderPage('home');

      expect(element).not.toBeNull();
      expect(typeof element).toBe('object');
    });

    it('forwards the current hash to AppHelper', function() {
      const controller = new AppController(null, null, () => '');
      const element = controller.renderPage('home', '#/categories?page=2&per_page=10');

      expect(element.props.children[1].key).toBe('#/categories?page=2&per_page=10');
    });
  });

  describe('#buildEffect', function() {
    it('adds and removes a hashchange listener', function() {
      const setPage = jasmine.createSpy('setPage');
      const mockTarget = jasmine.createSpyObj('eventTarget', ['addEventListener', 'removeEventListener']);
      const controller = new AppController(setPage, mockTarget, () => '#/categories');

      const cleanup = controller.buildEffect()();

      expect(mockTarget.addEventListener).toHaveBeenCalledWith('hashchange', jasmine.any(Function));

      cleanup();

      expect(mockTarget.removeEventListener).toHaveBeenCalledWith('hashchange', jasmine.any(Function));
    });

    it('calls setPage with the current page when hash changes', function() {
      const setPage = jasmine.createSpy('setPage');
      let capturedHandler;
      const mockTarget = {
        addEventListener: (event, handler) => { capturedHandler = handler; },
        removeEventListener: jasmine.createSpy('removeEventListener'),
      };
      const controller = new AppController(setPage, mockTarget, () => '#/categories');

      controller.buildEffect()();
      capturedHandler();

      expect(setPage).toHaveBeenCalledWith('categories');
    });

    it('calls setHash with the current hash when hash changes', function() {
      const setPage = jasmine.createSpy('setPage');
      const setHash = jasmine.createSpy('setHash');
      let capturedHandler;
      let currentHash = '#/categories?page=2&per_page=10';
      const mockTarget = {
        addEventListener: (event, handler) => { capturedHandler = handler; },
        removeEventListener: jasmine.createSpy('removeEventListener'),
      };
      const controller = new AppController(setPage, mockTarget, () => currentHash, setHash);

      controller.buildEffect()();
      capturedHandler();

      expect(setHash).toHaveBeenCalledWith('#/categories?page=2&per_page=10');
    });
  });
});
