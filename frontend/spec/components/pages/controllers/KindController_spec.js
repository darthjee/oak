import KindController, { getKindSlugFromHash } from '../../../../assets/js/components/pages/controllers/KindController.js';
import GenericClient from '../../../../assets/js/client/GenericClient.js';
import { isLoggedIn, setLoggedIn } from '../../../../assets/js/utils/authState.js';
import {
  buildSpies,
  flushPromises,
} from '../../../support/factories.js';

describe('KindController', function() {
  let mockClient;

  const buildMockClient = (overrides = {}) => ({
    currentHash: jasmine.createSpy('currentHash').and.returnValue('#/kinds/code'),
    fetch: jasmine.createSpy('fetch').and.returnValue(
      Promise.resolve({ slug: 'code', name: 'Code' })
    ),
    ...overrides,
  });

  const buildSetters = () => buildSpies(
    'setKind',
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

  describe('getKindSlugFromHash', function() {
    it('extracts slug from hash route', function() {
      const slug = getKindSlugFromHash('#/kinds/code?page=2');

      expect(slug).toBe('code');
    });

    it('extracts slug from a route with trailing slash', function() {
      const slug = getKindSlugFromHash('#/kinds/code/?page=2');

      expect(slug).toBe('code');
    });

    it('returns empty slug when hash does not match kind route', function() {
      const slug = getKindSlugFromHash('#/kinds');

      expect(slug).toBe('');
    });
  });

  it('fetches kind in buildEffect without waiting on a login check', async function() {
    const { setKind, setLogged, setLoading, setError } = buildSetters();
    const kind = { slug: 'code', name: 'Code' };

    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/kinds/code?foo=bar'),
      fetch: jasmine.createSpy('fetch').and.returnValue(Promise.resolve(kind)),
    });

    const controller = new KindController(setKind, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(mockClient.fetch).toHaveBeenCalledWith('/kinds/code.json');
    expect(setKind).toHaveBeenCalledWith(kind);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('seeds logged state from the current authState value', function() {
    setLoggedIn(true);
    const { setKind, setLogged, setLoading, setError } = buildSetters();

    const controller = new KindController(setKind, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    expect(setLogged).toHaveBeenCalledWith(true);
    expect(isLoggedIn()).toBe(true);

    cleanup();
  });

  it('updates logged state when authState changes after mount', async function() {
    const { setKind, setLogged, setLoading, setError } = buildSetters();

    const controller = new KindController(setKind, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();
    setLogged.calls.reset();

    setLoggedIn(true);

    expect(setLogged).toHaveBeenCalledWith(true);

    cleanup();
  });

  it('stops updating logged state after unmount', async function() {
    const { setKind, setLogged, setLoading, setError } = buildSetters();

    const controller = new KindController(setKind, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();
    cleanup();
    setLogged.calls.reset();

    setLoggedIn(true);

    expect(setLogged).not.toHaveBeenCalled();
  });

  it('calls setError when kind fetch fails', async function() {
    const { setKind, setLogged, setLoading, setError } = buildSetters();

    mockClient = buildMockClient({
      fetch: jasmine.createSpy('fetch').and.returnValue(
        Promise.reject(new Error('Request failed for /kinds/code.json'))
      ),
    });

    const controller = new KindController(setKind, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setKind).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Unable to load kind.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('calls setError when params cannot be extracted from hash', async function() {
    const { setKind, setLogged, setLoading, setError } = buildSetters();

    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/kinds'),
    });

    const controller = new KindController(setKind, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(mockClient.fetch).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Unable to load kind.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('does not call setters after unmount', async function() {
    const { setKind, setLogged, setLoading, setError } = buildSetters();

    const controller = new KindController(setKind, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    cleanup();

    await flushPromises();

    expect(setKind).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();
  });

  it('defaults client to a new GenericClient when none is provided', function() {
    const { setKind, setLogged, setLoading, setError } = buildSetters();

    const controller = new KindController(setKind, setLogged, setLoading, setError);

    expect(controller.client).toBeInstanceOf(GenericClient);
  });
});
