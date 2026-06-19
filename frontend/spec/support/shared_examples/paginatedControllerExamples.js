import GenericClient from '../../../assets/js/client/GenericClient.js';
import { isLoggedIn, setLoggedIn } from '../../../assets/js/utils/authState.js';
import {
  buildPaginatedMockClient,
  buildSpies,
  flushPromises,
} from '../factories.js';

/**
 * Shared examples for paginated-index controllers (e.g. CategoriesController, KindsController).
 *
 * The caller must set up preserveGlobals('fetch') in a beforeEach / afterEach pair so that
 * global.fetch is restored between tests.
 *
 * @param {Object} options
 * @param {Function} options.buildController - (spies, client?) => controller instance.
 *   The spies object has keys: setPrimary, setPagination, setLogged, setLoading, setError.
 *   When client is omitted the controller should default to a new GenericClient.
 * @param {string} options.endpoint - JSON endpoint the controller fetches (e.g. '/categories.json').
 * @param {Array}  options.sampleData - sample data array returned by a successful fetch.
 * @param {string} options.loadingErrorMsg - message passed to setError on a fetch failure.
 * @param {string} options.unexpectedErrorMsg - message passed to setError for errors without a message.
 *
 * Usage:
 *   itBehavesLikeAPaginatedController({
 *     buildController: (spies, client) => new MyController(
 *       spies.setPrimary, spies.setPagination, spies.setLogged, spies.setLoading, spies.setError, client
 *     ),
 *     endpoint: '/my-things.json',
 *     sampleData: [{ slug: 'thing', name: 'Thing' }],
 *     loadingErrorMsg: 'Unable to load my things.',
 *     unexpectedErrorMsg: 'Unexpected error while loading my things.',
 *   });
 */
export const itBehavesLikeAPaginatedController = ({
  buildController,
  endpoint,
  sampleData,
  loadingErrorMsg,
  unexpectedErrorMsg,
}) => {
  const makeSpies = () => buildSpies(
    'setPrimary', 'setPagination', 'setLogged', 'setLoading', 'setError'
  );

  afterEach(function() {
    setLoggedIn(false);
  });

  it('fetches data in buildEffect without waiting on a login check', async function() {
    const spies = makeSpies();
    const client = buildPaginatedMockClient({
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
        Promise.resolve({ data: sampleData, pagination: { page: 2, pages: 9, perPage: 12 } })
      ),
    });

    const controller = buildController(spies, client);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(client.fetchIndex).toHaveBeenCalledWith(endpoint);
    expect(spies.setPrimary).toHaveBeenCalledWith(sampleData);
    expect(spies.setPagination).toHaveBeenCalledWith({ page: 2, pages: 9, perPage: 12 });
    expect(spies.setLoading).toHaveBeenCalledWith(false);
    expect(spies.setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('seeds logged state from the current authState value', function() {
    setLoggedIn(true);
    const spies = makeSpies();
    const client = buildPaginatedMockClient();

    const controller = buildController(spies, client);
    const cleanup = controller.buildEffect()();

    expect(spies.setLogged).toHaveBeenCalledWith(true);
    expect(isLoggedIn()).toBe(true);

    cleanup();
  });

  it('updates logged state when authState changes after mount', async function() {
    const spies = makeSpies();
    const client = buildPaginatedMockClient();

    const controller = buildController(spies, client);
    const cleanup = controller.buildEffect()();

    await flushPromises();
    spies.setLogged.calls.reset();

    setLoggedIn(true);

    expect(spies.setLogged).toHaveBeenCalledWith(true);

    cleanup();
  });

  it('stops updating logged state after unmount', async function() {
    const spies = makeSpies();
    const client = buildPaginatedMockClient();

    const controller = buildController(spies, client);
    const cleanup = controller.buildEffect()();

    await flushPromises();
    cleanup();
    spies.setLogged.calls.reset();

    setLoggedIn(true);

    expect(spies.setLogged).not.toHaveBeenCalled();
  });

  it('calls client.fetchIndex with the correct endpoint', async function() {
    const spies = makeSpies();
    const client = buildPaginatedMockClient();

    const controller = buildController(spies, client);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(client.fetchIndex).toHaveBeenCalledWith(endpoint);
    expect(spies.setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('calls setError when data fetch fails', async function() {
    const spies = makeSpies();
    const client = buildPaginatedMockClient({
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
        Promise.reject(new Error(`Request failed for ${endpoint}`))
      ),
    });

    const controller = buildController(spies, client);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(spies.setError).toHaveBeenCalledWith(loadingErrorMsg);
    expect(spies.setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('does not call setters after unmount', async function() {
    const spies = makeSpies();
    const client = buildPaginatedMockClient();

    const controller = buildController(spies, client);
    const cleanup = controller.buildEffect()();

    cleanup();

    await flushPromises();

    expect(spies.setPrimary).not.toHaveBeenCalled();
    expect(spies.setPagination).not.toHaveBeenCalled();
    expect(spies.setLoading).not.toHaveBeenCalled();
  });

  it('applies fallback pagination when client returns minimal pagination', async function() {
    const spies = makeSpies();
    const client = buildPaginatedMockClient();

    const controller = buildController(spies, client);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(spies.setPagination).toHaveBeenCalledWith({ page: 1, pages: 1, perPage: 10 });
    expect(spies.setLoading).toHaveBeenCalledWith(false);
    expect(spies.setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('defaults client to a new GenericClient when none is provided', function() {
    const spies = makeSpies();
    const controller = buildController(spies);

    expect(controller.client).toBeInstanceOf(GenericClient);
  });

  it('falls back to empty array when fetchIndex returns non-array data', async function() {
    const spies = makeSpies();
    const client = buildPaginatedMockClient({
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
        Promise.resolve({ data: null, pagination: { page: 1, pages: 1, perPage: 10 } })
      ),
    });

    const controller = buildController(spies, client);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(spies.setPrimary).toHaveBeenCalledWith([]);
    expect(spies.setLoading).toHaveBeenCalledWith(false);
    expect(spies.setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('calls setError with fallback message when error has no message', async function() {
    const spies = makeSpies();
    const client = buildPaginatedMockClient({
      fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(Promise.reject(null)),
    });

    const controller = buildController(spies, client);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(spies.setError).toHaveBeenCalledWith(unexpectedErrorMsg);
    expect(spies.setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });
};
