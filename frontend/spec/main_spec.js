import { mount } from '../assets/js/main.jsx';
import { preserveGlobals, stubFetchResponse } from './support/factories.js';

describe('main', function() {
  let restoreGlobals;

  const buildWindow = () => ({
    location: { hash: '' },
    addEventListener: jasmine.createSpy('addEventListener'),
    removeEventListener: jasmine.createSpy('removeEventListener'),
  });

  beforeEach(function() {
    restoreGlobals = preserveGlobals('document', 'window', 'fetch');
    global.window = buildWindow();
    stubFetchResponse({ ok: false, status: 404 });
  });

  afterEach(function() {
    restoreGlobals();
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
