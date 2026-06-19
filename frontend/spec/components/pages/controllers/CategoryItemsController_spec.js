import CategoryItemsController from '../../../../assets/js/components/pages/controllers/CategoryItemsController.js';
import { isLoggedIn, setLoggedIn } from '../../../../assets/js/utils/authState.js';
import {
  buildSpies,
  flushPromises,
} from '../../../support/factories.js';

describe('CategoryItemsController', function() {
  let mockClient;

  const buildMockClient = (overrides = {}) => ({
    currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items'),
    fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
      Promise.resolve({ data: [], pagination: { page: 1, pages: 1, perPage: 10 } })
    ),
    ...overrides,
  });

  const buildSetters = () => buildSpies(
    'setItems',
    'setLogged',
    'setPagination',
    'setLoading',
    'setError'
  );

  beforeEach(function() {
    mockClient = buildMockClient();
  });

  afterEach(function() {
    setLoggedIn(false);
  });

  it('fetches category items in buildEffect without waiting on a login check', async function() {
    const { setItems, setLogged, setPagination, setLoading, setError } = buildSetters();

    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items?page=2&per_page=12'),
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
        Promise.resolve({
          data: [{ id: 35, name: 'Oak', snap_url: 'http://example.com/oak.png', link: null }],
          pagination: { page: 2, pages: 6, perPage: 12 },
        })
      ),
    });

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
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('seeds logged state from the current authState value', function() {
    setLoggedIn(true);
    const { setItems, setLogged, setPagination, setLoading, setError } = buildSetters();

    const controller = new CategoryItemsController(
      setItems, setLogged, setPagination, setLoading, setError, mockClient
    );
    const cleanup = controller.buildEffect()();

    expect(setLogged).toHaveBeenCalledWith(true);
    expect(isLoggedIn()).toBe(true);

    cleanup();
  });

  it('updates logged state when authState changes after mount', async function() {
    const { setItems, setLogged, setPagination, setLoading, setError } = buildSetters();

    const controller = new CategoryItemsController(
      setItems, setLogged, setPagination, setLoading, setError, mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();
    setLogged.calls.reset();

    setLoggedIn(true);

    expect(setLogged).toHaveBeenCalledWith(true);

    cleanup();
  });

  it('stops updating logged state after unmount', async function() {
    const { setItems, setLogged, setPagination, setLoading, setError } = buildSetters();

    const controller = new CategoryItemsController(
      setItems, setLogged, setPagination, setLoading, setError, mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();
    cleanup();
    setLogged.calls.reset();

    setLoggedIn(true);

    expect(setLogged).not.toHaveBeenCalled();
  });

  it('calls setError when category items fetch fails', async function() {
    const { setItems, setLogged, setPagination, setLoading, setError } = buildSetters();

    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items'),
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
        Promise.reject(new Error('Request failed for /categories/project/items.json'))
      ),
    });

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
    const { setItems, setLogged, setPagination, setLoading, setError } = buildSetters();

    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories'),
    });

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
    const { setItems, setLogged, setPagination, setLoading, setError } = buildSetters();

    const controller = new CategoryItemsController(
      setItems, setLogged, setPagination, setLoading, setError, mockClient
    );
    const cleanup = controller.buildEffect()();

    cleanup();

    await flushPromises();

    expect(setItems).not.toHaveBeenCalled();
    expect(setPagination).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();
  });
});
