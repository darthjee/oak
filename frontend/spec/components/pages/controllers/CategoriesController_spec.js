import CategoriesController from '../../../../assets/js/components/pages/controllers/CategoriesController.js';
import GenericClient from '../../../../assets/js/components/client/GenericClient.js';
import {
  buildSpies,
  flushPromises,
  preserveGlobals,
  stubFetch,
  stubLoginFetch,
} from '../../../support/factories.js';

describe('CategoriesController', function() {
  let restoreGlobals;
  let mockClient;

  const buildMockClient = (overrides = {}) => ({
    fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
      Promise.resolve({ data: [], pagination: { page: 1, pages: 1, perPage: 10 } })
    ),
    ...overrides,
  });

  const buildSetters = () => buildSpies(
    'setCategories',
    'setPagination',
    'setLogged',
    'setLoading',
    'setError'
  );

  beforeEach(function() {
    restoreGlobals = preserveGlobals('fetch');
    mockClient = buildMockClient();
  });

  afterEach(function() {
    restoreGlobals();
  });

  it('fetches categories and login state in buildEffect', async function() {
    const { setCategories, setPagination, setLogged, setLoading, setError } = buildSetters();

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
    const { setCategories, setPagination, setLogged, setLoading, setError } = buildSetters();

    mockClient = buildMockClient({
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
        Promise.resolve({ data: [], pagination: { page: 2, pages: 9, perPage: 12 } })
      ),
    });
    stubLoginFetch(404);

    const controller = new CategoriesController(
      setCategories, setPagination, setLogged, setLoading, setError,
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
    const { setCategories, setPagination, setLogged, setLoading, setError } = buildSetters();

    stubLoginFetch(404);

    const controller = new CategoriesController(
      setCategories, setPagination, setLogged, setLoading, setError,
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(mockClient.fetchIndex).toHaveBeenCalledWith('/categories.json');
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('calls setError when categories fetch fails', async function() {
    const { setCategories, setPagination, setLogged, setLoading, setError } = buildSetters();

    mockClient = buildMockClient({
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
        Promise.reject(new Error('Request failed for /categories.json'))
      ),
    });
    stubLoginFetch(404);

    const controller = new CategoriesController(
      setCategories, setPagination, setLogged, setLoading, setError,
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setError).toHaveBeenCalledWith('Unable to load categories.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('does not call setters after unmount', async function() {
    const { setCategories, setPagination, setLogged, setLoading, setError } = buildSetters();

    stubLoginFetch(404);

    const controller = new CategoriesController(
      setCategories, setPagination, setLogged, setLoading, setError,
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
    const { setCategories, setPagination, setLogged, setLoading, setError } = buildSetters();

    stubLoginFetch(404);

    const controller = new CategoriesController(
      setCategories, setPagination, setLogged, setLoading, setError,
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
    const { setCategories, setPagination, setLogged, setLoading, setError } = buildSetters();

    stubLoginFetch(404);

    const controller = new CategoriesController(
      setCategories, setPagination, setLogged, setLoading, setError,
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(global.fetch).toHaveBeenCalledWith('/users/login.json', { headers: { Accept: 'application/json' } });

    cleanup();
  });

  it('defaults client to a new GenericClient when none is provided', function() {
    const { setCategories, setPagination, setLogged, setLoading, setError } = buildSetters();

    const controller = new CategoriesController(
      setCategories, setPagination, setLogged, setLoading, setError
    );

    expect(controller.client).toBeInstanceOf(GenericClient);
  });

  it('falls back to empty array when fetchIndex returns non-array data', async function() {
    const { setCategories, setPagination, setLogged, setLoading, setError } = buildSetters();

    mockClient = buildMockClient({
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
        Promise.resolve({ data: null, pagination: { page: 1, pages: 1, perPage: 10 } })
      ),
    });
    stubLoginFetch(404);

    const controller = new CategoriesController(
      setCategories, setPagination, setLogged, setLoading, setError,
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setCategories).toHaveBeenCalledWith([]);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('calls setError with fallback message when error has no message', async function() {
    const { setCategories, setPagination, setLogged, setLoading, setError } = buildSetters();

    stubFetch(() => Promise.reject(null));

    const controller = new CategoriesController(
      setCategories, setPagination, setLogged, setLoading, setError,
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setError).toHaveBeenCalledWith('Unexpected error while loading categories.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('calls setError when login returns an unexpected status', async function() {
    const { setCategories, setPagination, setLogged, setLoading, setError } = buildSetters();

    stubLoginFetch(500);

    const controller = new CategoriesController(
      setCategories, setPagination, setLogged, setLoading, setError,
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setError).toHaveBeenCalledWith('Unable to check login status.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });
});
