import HeaderController from '../../../../assets/js/components/elements/controllers/HeaderController.js';

const flushPromises = async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

describe('HeaderController', function() {
  let originalFetch;

  beforeEach(function() {
    originalFetch = global.fetch;
  });

  afterEach(function() {
    global.fetch = originalFetch;
  });

  it('loads login state and categories in buildEffect', async function() {
    const setLogged = jasmine.createSpy('setLogged');
    const setCategories = jasmine.createSpy('setCategories');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    global.fetch = jasmine.createSpy('fetch').and.callFake((url) => {
      if (url === '/users/login.json') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'abc' }),
        });
      }

      if (url === '/user/categories.json') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ slug: 'miniatures', name: 'Miniatures' }]),
        });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const controller = new HeaderController(setLogged, setCategories, setLoading, setError);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setLogged).toHaveBeenCalledWith(true);
    expect(setCategories).toHaveBeenCalledWith([
      { slug: 'miniatures', name: 'Miniatures' },
    ]);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('handles non-logged users when login check returns 404', async function() {
    const setLogged = jasmine.createSpy('setLogged');
    const setCategories = jasmine.createSpy('setCategories');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    global.fetch = jasmine.createSpy('fetch').and.callFake((url) => {
      if (url === '/users/login.json') {
        return Promise.resolve({ ok: false, status: 404 });
      }

      if (url === '/user/categories.json') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const controller = new HeaderController(setLogged, setCategories, setLoading, setError);

    controller.buildEffect()();
    await flushPromises();

    expect(setLogged).toHaveBeenCalledWith(false);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();
  });

  it('logs off and reloads categories', async function() {
    const setLogged = jasmine.createSpy('setLogged');
    const setCategories = jasmine.createSpy('setCategories');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    global.fetch = jasmine.createSpy('fetch').and.callFake((url) => {
      if (url === '/users/logoff.json') {
        return Promise.resolve({ ok: true });
      }

      if (url === '/user/categories.json') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ slug: 'all', name: 'All Categories' }]),
        });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const controller = new HeaderController(setLogged, setCategories, setLoading, setError);

    await controller.handleLogoff();

    expect(setLogged).toHaveBeenCalledWith(false);
    expect(setCategories).toHaveBeenCalledWith([
      { slug: 'all', name: 'All Categories' },
    ]);
    expect(setError).not.toHaveBeenCalled();
  });

  it('increments refreshKey after logoff when provided', async function() {
    const setLogged = jasmine.createSpy('setLogged');
    const setCategories = jasmine.createSpy('setCategories');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setRefreshKey = jasmine.createSpy('setRefreshKey');

    global.fetch = jasmine.createSpy('fetch').and.callFake((url) => {
      if (url === '/users/logoff.json') {
        return Promise.resolve({ ok: true });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const controller = new HeaderController(
      setLogged,
      setCategories,
      setLoading,
      setError,
      setRefreshKey
    );

    await controller.handleLogoff();

    expect(setLogged).toHaveBeenCalledWith(false);
    expect(setRefreshKey).toHaveBeenCalled();
    expect(setCategories).not.toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();
  });
});
