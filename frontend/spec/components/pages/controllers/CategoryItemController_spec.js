import CategoryItemController, { getCategoryItemParamsFromHash } from '../../../../assets/js/components/pages/controllers/CategoryItemController.js';

const flushPromises = async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

describe('CategoryItemController', function() {
  let originalFetch;
  let mockClient;

  const buildMockClient = (overrides = {}) => ({
    currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items/35'),
    fetch: jasmine.createSpy('fetch').and.returnValue(
      Promise.resolve({ id: 35, name: 'Oak', category: { slug: 'project' } })
    ),
    ...overrides,
  });

  const stubLoginFetch = (status = 404) => {
    global.fetch = jasmine.createSpy('fetch').and.callFake((url) => {
      if (url === '/users/login.json') {
        if (status === 200) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ token: 'abc' }),
          });
        }

        return Promise.resolve({ ok: false, status });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });
  };

  beforeEach(function() {
    originalFetch = global.fetch;
    mockClient = buildMockClient();
  });

  afterEach(function() {
    global.fetch = originalFetch;
  });

  describe('getCategoryItemParamsFromHash', function() {
    it('extracts slug and id from hash route', function() {
      const params = getCategoryItemParamsFromHash('#/categories/project/items/35?page=2');

      expect(params).toEqual({ slug: 'project', id: '35' });
    });
  });

  it('fetches category item and login state in buildEffect', async function() {
    const setItem = jasmine.createSpy('setItem');
    const setLogged = jasmine.createSpy('setLogged');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const item = {
      id: 35,
      name: 'Oak',
      description: 'A project',
      category: { slug: 'project', name: 'Project' },
      kind: { name: 'Code' },
      photos: [],
      links: [],
    };

    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items/35?foo=bar'),
      fetch: jasmine.createSpy('fetch').and.returnValue(Promise.resolve(item)),
    });
    stubLoginFetch(200);

    const controller = new CategoryItemController(setItem, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(mockClient.fetch).toHaveBeenCalledWith('/categories/project/items/35.json');
    expect(setItem).toHaveBeenCalledWith(item);
    expect(setLogged).toHaveBeenCalledWith(true);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets logged to false when login returns 404', async function() {
    const setItem = jasmine.createSpy('setItem');
    const setLogged = jasmine.createSpy('setLogged');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    stubLoginFetch(404);

    const controller = new CategoryItemController(setItem, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setLogged).toHaveBeenCalledWith(false);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('calls setError when category item fetch fails', async function() {
    const setItem = jasmine.createSpy('setItem');
    const setLogged = jasmine.createSpy('setLogged');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items/35'),
      fetch: jasmine.createSpy('fetch').and.returnValue(
        Promise.reject(new Error('Request failed for /categories/project/items/35.json'))
      ),
    });
    stubLoginFetch(404);

    const controller = new CategoryItemController(setItem, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setError).toHaveBeenCalledWith('Unable to load category item.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('calls setError when params cannot be extracted from hash', async function() {
    const setItem = jasmine.createSpy('setItem');
    const setLogged = jasmine.createSpy('setLogged');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items'),
    });
    stubLoginFetch(404);

    const controller = new CategoryItemController(setItem, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(mockClient.fetch).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Unable to load category item.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('does not call setters after unmount', async function() {
    const setItem = jasmine.createSpy('setItem');
    const setLogged = jasmine.createSpy('setLogged');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    stubLoginFetch(404);

    const controller = new CategoryItemController(setItem, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    cleanup();

    await flushPromises();

    expect(setItem).not.toHaveBeenCalled();
    expect(setLogged).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();
  });
});
