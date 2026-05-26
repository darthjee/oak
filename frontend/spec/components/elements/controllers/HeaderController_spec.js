import HeaderController from '../../../../assets/js/components/elements/controllers/HeaderController.js';
import {
  buildSpies,
  flushPromises,
  preserveGlobals,
  stubFetch,
} from '../../../support/factories.js';

describe('HeaderController', function() {
  let restoreGlobals;

  const buildSetters = () => buildSpies(
    'setLogged',
    'setCategories',
    'setLoading',
    'setError'
  );

  beforeEach(function() {
    restoreGlobals = preserveGlobals('fetch');
  });

  afterEach(function() {
    restoreGlobals();
  });

  it('loads login state and categories in buildEffect', async function() {
    const { setLogged, setCategories, setLoading, setError } = buildSetters();

    stubFetch((url) => {
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
    expect(setLoading).toHaveBeenCalledWith(true);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).toHaveBeenCalledWith(null);

    cleanup();
  });

  it('handles non-logged users when login check returns 404', async function() {
    const { setLogged, setCategories, setLoading, setError } = buildSetters();

    stubFetch((url) => {
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
    expect(setLoading).toHaveBeenCalledWith(true);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).toHaveBeenCalledWith(null);
  });

  it('logs off and reloads categories', async function() {
    const { setLogged, setCategories, setLoading, setError } = buildSetters();

    stubFetch((url) => {
      if (url === '/users/logoff.json') {
        return Promise.resolve({ ok: true });
      }

      if (url === '/users/login.json') {
        return Promise.resolve({ ok: false, status: 404 });
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
    expect(setLoading).toHaveBeenCalledWith(true);
    expect(setCategories).toHaveBeenCalledWith([
      { slug: 'all', name: 'All Categories' },
    ]);
    expect(setError).toHaveBeenCalledWith(null);
  });

  it('reloads header data on demand', async function() {
    const { setLogged, setCategories, setLoading, setError } = buildSetters();

    stubFetch((url) => {
      if (url === '/users/login.json') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'abc' }),
        });
      }

      if (url === '/user/categories.json') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ slug: 'project', name: 'Project' }]),
        });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const controller = new HeaderController(
      setLogged,
      setCategories,
      setLoading,
      setError
    );

    await controller.reload();

    expect(setLoading).toHaveBeenCalledWith(true);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).toHaveBeenCalledWith(null);
    expect(setLogged).toHaveBeenCalledWith(true);
    expect(setCategories).toHaveBeenCalledWith([{ slug: 'project', name: 'Project' }]);
  });
});
