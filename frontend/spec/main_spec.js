import { mount } from '../assets/js/main.jsx';

describe('main', function() {
  let originalDocument;
  let originalWindow;
  let originalFetch;

  beforeEach(function() {
    originalDocument = global.document;
    originalWindow = global.window;
    originalFetch = global.fetch;

    global.window = {
      location: { hash: '' },
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
    };

    global.fetch = jasmine.createSpy('fetch').and.returnValue(
      Promise.resolve({ ok: false, status: 404 })
    );
  });

  afterEach(function() {
    global.document = originalDocument;
    global.window = originalWindow;
    global.fetch = originalFetch;
  });

  describe('#mount', function() {
    it('queries the DOM for the #root element', function() {
      const getElementByIdSpy = jasmine.createSpy('getElementById').and.returnValue(null);

      global.document = { getElementById: getElementByIdSpy };

      try {
        mount();
      } catch {
        // React will throw because the container is not a real DOM node; that's expected in tests.
      }

      expect(getElementByIdSpy).toHaveBeenCalledWith('root');
    });
  });
});
