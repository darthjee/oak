import CategoryItemsController from '../../../../assets/js/components/pages/controllers/CategoryItemsController.js';
import { flushPromises, stubLoginFetch } from '../../../support/factories.js';

describe('CategoryItemsController', function() {
  let originalFetch;
  let mockClient;

  const buildMockClient = (overrides = {}) => ({
    currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items'),
    fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
      Promise.resolve({ data: [], pagination: { page: 1, pages: 1, perPage: 10 } })
    ),
    ...overrides,
  });

  beforeEach(function() {
    originalFetch = global.fetch;
    mockClient = buildMockClient();
  });

  afterEach(function() {
    global.fetch = originalFetch;
  });

  it('fetches category items and login state in buildEffect', async function() {
    const setItems = jasmine.createSpy('setItems');
    const setLogged = jasmine.createSpy('setLogged');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items?page=2&per_page=12'),
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
        Promise.resolve({
          data: [{ id: 35, name: 'Oak', snap_url: 'http://example.com/oak.png', link: null }],
          pagination: { page: 2, pages: 6, perPage: 12 },
        })
      ),
    });
    stubLoginFetch(200);

    const controller = new CategoryItemsController(
      setItems, setLogged, setPagination, setLoading, setError, mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(mockClient.fetchIndex).toHaveBeenCalledWith('/categories/project/items.json');
    expect(setItems).toHaveBeenCalledWith([
      { id: 35, name: 'Oak', snap_url: 'http://example.com/oak.png', link: null },
    ]);
    expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 6, perPage: 12 });
    expect(setLogged).toHaveBeenCalledWith(true);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets logged to false when login returns 404', async function() {
    const setItems = jasmine.createSpy('setItems');
    const setLogged = jasmine.createSpy('setLogged');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    stubLoginFetch(404);

    const controller = new CategoryItemsController(
      setItems, setLogged, setPagination, setLoading, setError, mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setLogged).toHaveBeenCalledWith(false);
    expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 1, perPage: 10 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('calls setError when category items fetch fails', async function() {
    const setItems = jasmine.createSpy('setItems');
    const setLogged = jasmine.createSpy('setLogged');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items'),
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
        Promise.reject(new Error('Request failed for /categories/project/items.json'))
      ),
    });
    stubLoginFetch(404);

    const controller = new CategoryItemsController(
      setItems, setLogged, setPagination, setLoading, setError, mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setError).toHaveBeenCalledWith('Unable to load category items.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('calls setError when slug cannot be extracted from hash', async function() {
    const setItems = jasmine.createSpy('setItems');
    const setLogged = jasmine.createSpy('setLogged');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories'),
    });
    stubLoginFetch(404);

    const controller = new CategoryItemsController(
      setItems, setLogged, setPagination, setLoading, setError, mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(mockClient.fetchIndex).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Unable to load category items.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('does not call setters after unmount', async function() {
    const setItems = jasmine.createSpy('setItems');
    const setLogged = jasmine.createSpy('setLogged');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    stubLoginFetch(404);

    const controller = new CategoryItemsController(
      setItems, setLogged, setPagination, setLoading, setError, mockClient
    );
    const cleanup = controller.buildEffect()();

    cleanup();

    await flushPromises();

    expect(setItems).not.toHaveBeenCalled();
    expect(setLogged).not.toHaveBeenCalled();
    expect(setPagination).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();
  });
});
