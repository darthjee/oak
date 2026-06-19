import CategoryItemController, { getCategoryItemParamsFromHash } from '../../../../assets/js/components/pages/controllers/CategoryItemController.js';
import GenericClient from '../../../../assets/js/client/GenericClient.js';
import { isLoggedIn, setLoggedIn } from '../../../../assets/js/utils/authState.js';
import {
  buildSpies,
  flushPromises,
} from '../../../support/factories.js';

describe('CategoryItemController', function() {
  let mockClient;

  const buildMockClient = (overrides = {}) => ({
    currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items/35'),
    fetch: jasmine.createSpy('fetch').and.returnValue(
      Promise.resolve({ id: 35, name: 'Oak', category: { slug: 'project' } })
    ),
    ...overrides,
  });

  const buildSetters = () => buildSpies(
    'setItem',
    'setLogged',
    'setLoading',
    'setError'
  );

  beforeEach(function() {
    mockClient = buildMockClient();
  });

  afterEach(function() {
    setLoggedIn(false);
  });

  describe('getCategoryItemParamsFromHash', function() {
    it('extracts slug and id from hash route', function() {
      const params = getCategoryItemParamsFromHash('#/categories/project/items/35?page=2');

      expect(params).toEqual({ slug: 'project', id: '35' });
    });

    it('extracts slug and id from a route with a trailing slash', function() {
      const params = getCategoryItemParamsFromHash('#/categories/project/items/35/?page=2');

      expect(params).toEqual({ slug: 'project', id: '35' });
    });

    it('returns empty params when the hash does not match the item route', function() {
      const params = getCategoryItemParamsFromHash('#/categories/project/items');

      expect(params).toEqual({ slug: '', id: '' });
    });
  });

  it('fetches category item in buildEffect without waiting on a login check', async function() {
    const { setItem, setLogged, setLoading, setError } = buildSetters();
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

    const controller = new CategoryItemController(setItem, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(mockClient.fetch).toHaveBeenCalledWith('/categories/project/items/35.json');
    expect(setItem).toHaveBeenCalledWith(item);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('seeds logged state from the current authState value', function() {
    setLoggedIn(true);
    const { setItem, setLogged, setLoading, setError } = buildSetters();

    const controller = new CategoryItemController(setItem, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    expect(setLogged).toHaveBeenCalledWith(true);
    expect(isLoggedIn()).toBe(true);

    cleanup();
  });

  it('updates logged state when authState changes after mount', async function() {
    const { setItem, setLogged, setLoading, setError } = buildSetters();

    const controller = new CategoryItemController(setItem, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();
    setLogged.calls.reset();

    setLoggedIn(true);

    expect(setLogged).toHaveBeenCalledWith(true);

    cleanup();
  });

  it('stops updating logged state after unmount', async function() {
    const { setItem, setLogged, setLoading, setError } = buildSetters();

    const controller = new CategoryItemController(setItem, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();
    cleanup();
    setLogged.calls.reset();

    setLoggedIn(true);

    expect(setLogged).not.toHaveBeenCalled();
  });

  it('calls setError when category item fetch fails', async function() {
    const { setItem, setLogged, setLoading, setError } = buildSetters();

    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items/35'),
      fetch: jasmine.createSpy('fetch').and.returnValue(
        Promise.reject(new Error('Request failed for /categories/project/items/35.json'))
      ),
    });

    const controller = new CategoryItemController(setItem, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setError).toHaveBeenCalledWith('Unable to load category item.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('calls setError when params cannot be extracted from hash', async function() {
    const { setItem, setLogged, setLoading, setError } = buildSetters();

    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items'),
    });

    const controller = new CategoryItemController(setItem, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(mockClient.fetch).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Unable to load category item.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('does not call setters after unmount', async function() {
    const { setItem, setLogged, setLoading, setError } = buildSetters();

    const controller = new CategoryItemController(setItem, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    cleanup();

    await flushPromises();

    expect(setItem).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();
  });

  it('defaults client to a new GenericClient when none is provided', function() {
    const { setItem, setLogged, setLoading, setError } = buildSetters();

    const controller = new CategoryItemController(setItem, setLogged, setLoading, setError);

    expect(controller.client).toBeInstanceOf(GenericClient);
  });
});
