import GenericClient from '../../../../assets/js/client/GenericClient.js';
import KindsController from '../../../../assets/js/components/pages/controllers/KindsController.js';
import {
  buildPaginatedMockClient,
  buildSpies,
  flushPromises,
  preserveGlobals,
  stubFetch,
  stubLoginFetch,
} from '../../../support/factories.js';

describe('KindsController', function() {
  let restoreGlobals;
  let mockClient;

  const buildSetters = () => buildSpies(
    'setKinds',
    'setPagination',
    'setLogged',
    'setLoading',
    'setError'
  );

  beforeEach(function() {
    restoreGlobals = preserveGlobals('fetch');
    mockClient = buildPaginatedMockClient();
  });

  afterEach(function() {
    restoreGlobals();
  });

  it('fetches kinds and login state in buildEffect', async function() {
    const { setKinds, setPagination, setLogged, setLoading, setError } = buildSetters();

    mockClient = buildPaginatedMockClient({
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
        Promise.resolve({
          data: [{ slug: 'project', name: 'Project', snap_url: 'http://example.com/snap.png' }],
          pagination: { page: 2, pages: 9, perPage: 12 },
        })
      ),
    });
    stubLoginFetch(200);

    const controller = new KindsController(
      setKinds, setPagination, setLogged, setLoading, setError,
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(mockClient.fetchIndex).toHaveBeenCalledWith('/kinds.json');
    expect(setKinds).toHaveBeenCalledWith([
      { slug: 'project', name: 'Project', snap_url: 'http://example.com/snap.png' },
    ]);
    expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 9, perPage: 12 });
    expect(setLogged).toHaveBeenCalledWith(true);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets logged to false when login returns 404', async function() {
    const { setKinds, setPagination, setLogged, setLoading, setError } = buildSetters();

    mockClient = buildPaginatedMockClient({
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
        Promise.resolve({ data: [], pagination: { page: 2, pages: 9, perPage: 12 } })
      ),
    });
    stubLoginFetch(404);

    const controller = new KindsController(
      setKinds, setPagination, setLogged, setLoading, setError,
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

  it('calls client.fetchIndex with /kinds.json', async function() {
    const { setKinds, setPagination, setLogged, setLoading, setError } = buildSetters();

    stubLoginFetch(404);

    const controller = new KindsController(
      setKinds, setPagination, setLogged, setLoading, setError,
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(mockClient.fetchIndex).toHaveBeenCalledWith('/kinds.json');
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('calls setError when kinds fetch fails', async function() {
    const { setKinds, setPagination, setLogged, setLoading, setError } = buildSetters();

    mockClient = buildPaginatedMockClient({
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
        Promise.reject(new Error('Request failed for /kinds.json'))
      ),
    });
    stubLoginFetch(404);

    const controller = new KindsController(
      setKinds, setPagination, setLogged, setLoading, setError,
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setError).toHaveBeenCalledWith('Unable to load kinds.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('does not call setters after unmount', async function() {
    const { setKinds, setPagination, setLogged, setLoading, setError } = buildSetters();

    stubLoginFetch(404);

    const controller = new KindsController(
      setKinds, setPagination, setLogged, setLoading, setError,
      mockClient
    );
    const cleanup = controller.buildEffect()();

    cleanup();

    await flushPromises();

    expect(setKinds).not.toHaveBeenCalled();
    expect(setPagination).not.toHaveBeenCalled();
    expect(setLogged).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });

  it('applies fallback pagination when client returns minimal pagination', async function() {
    const { setKinds, setPagination, setLogged, setLoading, setError } = buildSetters();

    stubLoginFetch(404);

    const controller = new KindsController(
      setKinds, setPagination, setLogged, setLoading, setError,
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
    const { setKinds, setPagination, setLogged, setLoading, setError } = buildSetters();

    stubLoginFetch(404);

    const controller = new KindsController(
      setKinds, setPagination, setLogged, setLoading, setError,
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(global.fetch).toHaveBeenCalledWith('/users/login.json', { headers: { Accept: 'application/json' } });

    cleanup();
  });

  it('defaults client to a new GenericClient when none is provided', function() {
    const { setKinds, setPagination, setLogged, setLoading, setError } = buildSetters();

    const controller = new KindsController(
      setKinds, setPagination, setLogged, setLoading, setError
    );

    expect(controller.client).toBeInstanceOf(GenericClient);
  });

  it('falls back to empty array when fetchIndex returns non-array data', async function() {
    const { setKinds, setPagination, setLogged, setLoading, setError } = buildSetters();

    mockClient = buildPaginatedMockClient({
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
        Promise.resolve({ data: null, pagination: { page: 1, pages: 1, perPage: 10 } })
      ),
    });
    stubLoginFetch(404);

    const controller = new KindsController(
      setKinds, setPagination, setLogged, setLoading, setError,
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setKinds).toHaveBeenCalledWith([]);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('calls setError with fallback message when error has no message', async function() {
    const { setKinds, setPagination, setLogged, setLoading, setError } = buildSetters();

    stubFetch(() => Promise.reject(null));

    const controller = new KindsController(
      setKinds, setPagination, setLogged, setLoading, setError,
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setError).toHaveBeenCalledWith('Unexpected error while loading kinds.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('calls setError when login returns an unexpected status', async function() {
    const { setKinds, setPagination, setLogged, setLoading, setError } = buildSetters();

    stubLoginFetch(500);

    const controller = new KindsController(
      setKinds, setPagination, setLogged, setLoading, setError,
      mockClient
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setError).toHaveBeenCalledWith('Unable to check login status.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });
});
