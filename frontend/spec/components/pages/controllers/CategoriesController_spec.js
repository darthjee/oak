import CategoriesController from '../../../../assets/js/components/pages/controllers/CategoriesController.js';

const flushPromises = async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

describe('CategoriesController', function() {
  let originalFetch;
  let headers;

  const buildResponseHeaders = (values = {}) => ({
    get(name) {
      return values[name] ?? null;
    },
  });

  beforeEach(function() {
    originalFetch = global.fetch;
    headers = buildResponseHeaders({ page: '2', pages: '9', per_page: '12' });
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

    global.fetch = jasmine.createSpy('fetch').and.callFake((url) => {
      if (url === '/categories.json') {
        return Promise.resolve({
          ok: true,
          headers,
          json: () => Promise.resolve([{ slug: 'project', name: 'Project', snap_url: 'http://example.com/snap.png' }]),
        });
      }

      if (url === '/users/login.json') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'abc' }),
        });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const controller = new CategoriesController(setCategories, setPagination, setLogged, setLoading, setError);
    const cleanup = controller.buildEffect()();

    await flushPromises();

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

    global.fetch = jasmine.createSpy('fetch').and.callFake((url) => {
      if (url === '/categories.json') {
        return Promise.resolve({
          ok: true,
          headers,
          json: () => Promise.resolve([]),
        });
      }

      if (url === '/users/login.json') {
        return Promise.resolve({ ok: false, status: 404 });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const controller = new CategoriesController(setCategories, setPagination, setLogged, setLoading, setError);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setLogged).toHaveBeenCalledWith(false);
    expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 9, perPage: 12 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('calls setError when categories fetch fails', async function() {
    const setCategories = jasmine.createSpy('setCategories');
    const setPagination = jasmine.createSpy('setPagination');
    const setLogged = jasmine.createSpy('setLogged');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    global.fetch = jasmine.createSpy('fetch').and.callFake((url) => {
      if (url === '/categories.json') {
        return Promise.resolve({ ok: false, status: 500 });
      }

      if (url === '/users/login.json') {
        return Promise.resolve({ ok: false, status: 404 });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const controller = new CategoriesController(setCategories, setPagination, setLogged, setLoading, setError);
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

    global.fetch = jasmine.createSpy('fetch').and.callFake((url) => {
      if (url === '/categories.json') {
        return Promise.resolve({
          ok: true,
          headers,
          json: () => Promise.resolve([]),
        });
      }

      if (url === '/users/login.json') {
        return Promise.resolve({ ok: false, status: 404 });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const controller = new CategoriesController(setCategories, setPagination, setLogged, setLoading, setError);
    const cleanup = controller.buildEffect()();

    cleanup();

    await flushPromises();

    expect(setCategories).not.toHaveBeenCalled();
    expect(setPagination).not.toHaveBeenCalled();
    expect(setLogged).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });

  it('applies fallback pagination when response headers are missing', async function() {
    const setCategories = jasmine.createSpy('setCategories');
    const setPagination = jasmine.createSpy('setPagination');
    const setLogged = jasmine.createSpy('setLogged');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    global.fetch = jasmine.createSpy('fetch').and.callFake((url) => {
      if (url === '/categories.json') {
        return Promise.resolve({
          ok: true,
          headers: buildResponseHeaders(),
          json: () => Promise.resolve([]),
        });
      }

      if (url === '/users/login.json') {
        return Promise.resolve({ ok: false, status: 404 });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const controller = new CategoriesController(setCategories, setPagination, setLogged, setLoading, setError);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 1, perPage: 10 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
