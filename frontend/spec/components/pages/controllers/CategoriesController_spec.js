import CategoriesController from '../../../../assets/js/components/pages/controllers/CategoriesController.js';

const flushPromises = async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

describe('CategoriesController', function() {
  let originalFetch;
  let mockClient;

  const buildMockClient = (overrides = {}) => ({
    fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
      Promise.resolve({ data: [], pagination: { page: 1, pages: 1, perPage: 10 } })
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

  it('fetches categories and login state in buildEffect', async function() {
    const setCategories = jasmine.createSpy('setCategories');
    const setPagination = jasmine.createSpy('setPagination');
    const setLogged = jasmine.createSpy('setLogged');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    mockClient = buildMockClient({
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
        Promise.resolve({
          data: [{ slug: 'project', name: 'Project', snap_url: 'http://example.com/snap.png' }],
          pagination: { page: 2, pages: 9, perPage: 12 },
        })
      ),
    });
    stubLoginFetch(200);

    const controller = new CategoriesController(
      setCategories, setPagination, setLogged, setLoading, setError,
      () => '',
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(mockClient.fetchIndex).toHaveBeenCalledWith('/categories.json');
    expect(setCategories).toHaveBeenCalledWith([
      { slug: 'project', name: 'Project', snap_url: 'http://example.com/snap.png' },
    ]);
    expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 9, perPage: 12 });
    expect(setLogged).toHaveBeenCalledWith(true);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets logged to false when login returns 404', async function() {
    const setCategories = jasmine.createSpy('setCategories');
    const setPagination = jasmine.createSpy('setPagination');
    const setLogged = jasmine.createSpy('setLogged');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    mockClient = buildMockClient({
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
        Promise.resolve({ data: [], pagination: { page: 2, pages: 9, perPage: 12 } })
      ),
    });
    stubLoginFetch(404);

    const controller = new CategoriesController(
      setCategories, setPagination, setLogged, setLoading, setError,
      () => '',
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setLogged).toHaveBeenCalledWith(false);
    expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 9, perPage: 12 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('calls client.fetchIndex with /categories.json', async function() {
    const setCategories = jasmine.createSpy('setCategories');
    const setPagination = jasmine.createSpy('setPagination');
    const setLogged = jasmine.createSpy('setLogged');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    stubLoginFetch(404);

    const controller = new CategoriesController(
      setCategories, setPagination, setLogged, setLoading, setError,
      () => '#/categories?page=2',
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(mockClient.fetchIndex).toHaveBeenCalledWith('/categories.json');
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('calls setError when categories fetch fails', async function() {
    const setCategories = jasmine.createSpy('setCategories');
    const setPagination = jasmine.createSpy('setPagination');
    const setLogged = jasmine.createSpy('setLogged');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    mockClient = buildMockClient({
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
        Promise.reject(new Error('Request failed for /categories.json'))
      ),
    });
    stubLoginFetch(404);

    const controller = new CategoriesController(
      setCategories, setPagination, setLogged, setLoading, setError,
      () => '',
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setError).toHaveBeenCalledWith('Unable to load categories.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('does not call setters after unmount', async function() {
    const setCategories = jasmine.createSpy('setCategories');
    const setPagination = jasmine.createSpy('setPagination');
    const setLogged = jasmine.createSpy('setLogged');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    stubLoginFetch(404);

    const controller = new CategoriesController(
      setCategories, setPagination, setLogged, setLoading, setError,
      () => '',
      mockClient
    );
    const cleanup = controller.buildEffect()();

    cleanup();

    await flushPromises();

    expect(setCategories).not.toHaveBeenCalled();
    expect(setPagination).not.toHaveBeenCalled();
    expect(setLogged).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });

  it('applies fallback pagination when client returns minimal pagination', async function() {
    const setCategories = jasmine.createSpy('setCategories');
    const setPagination = jasmine.createSpy('setPagination');
    const setLogged = jasmine.createSpy('setLogged');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    stubLoginFetch(404);

    const controller = new CategoriesController(
      setCategories, setPagination, setLogged, setLoading, setError,
      () => '',
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 1, perPage: 10 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('calls global.fetch directly for login check', async function() {
    const setCategories = jasmine.createSpy('setCategories');
    const setPagination = jasmine.createSpy('setPagination');
    const setLogged = jasmine.createSpy('setLogged');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    stubLoginFetch(404);

    const controller = new CategoriesController(
      setCategories, setPagination, setLogged, setLoading, setError,
      () => '',
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(global.fetch).toHaveBeenCalledWith('/users/login.json', { headers: { Accept: 'application/json' } });

    cleanup();
  });
});

