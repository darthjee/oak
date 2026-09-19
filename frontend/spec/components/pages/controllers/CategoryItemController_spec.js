import CategoryItemController, { getCategoryItemParamsFromHash } from '../../../../assets/js/components/pages/controllers/CategoryItemController.js';
import GenericClient from '../../../../assets/js/client/GenericClient.js';
import PhotoUploadClient from '../../../../assets/js/client/PhotoUploadClient.js';
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
    'setError',
    'setDeletingPhotoId',
    'setDeleteErrorByPhotoId'
  );

  const buildMockUploadClient = (overrides = {}) => ({
    delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve()),
    ...overrides,
  });

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

  it('defaults uploadClient to a new PhotoUploadClient when none is provided', function() {
    const { setItem, setLogged, setLoading, setError } = buildSetters();

    const controller = new CategoryItemController(setItem, setLogged, setLoading, setError);

    expect(controller.uploadClient).toBeInstanceOf(PhotoUploadClient);
  });

  describe('#deletePhoto', function() {
    const buildController = (setters, overrides = {}) => new CategoryItemController(
      setters.setItem,
      setters.setLogged,
      setters.setLoading,
      setters.setError,
      overrides.client || mockClient,
      overrides.uploadClient || buildMockUploadClient(),
      setters.setDeletingPhotoId,
      setters.setDeleteErrorByPhotoId
    );

    it('deletes the photo and refetches the item on success', async function() {
      const setters = buildSetters();
      const mockUploadClient = buildMockUploadClient();
      const controller = buildController(setters, { uploadClient: mockUploadClient });

      await controller.deletePhoto({ id: 35 }, 7);

      expect(mockUploadClient.delete).toHaveBeenCalledWith('project', '35', 7);
      expect(mockClient.fetch).toHaveBeenCalledWith('/categories/project/items/35.json');
      expect(setters.setItem).toHaveBeenCalledWith({ id: 35, name: 'Oak', category: { slug: 'project' } });
      expect(setters.setDeletingPhotoId).toHaveBeenCalledWith(7);
      expect(setters.setDeletingPhotoId).toHaveBeenCalledWith(null);

      const clearPriorError = setters.setDeleteErrorByPhotoId.calls.first().args[0];
      expect(clearPriorError({ 7: 'stale error' })).toEqual({});
    });

    it('sets a per-photo delete error and clears deletingPhotoId when the delete fails', async function() {
      const setters = buildSetters();
      const mockUploadClient = buildMockUploadClient({
        delete: jasmine.createSpy('delete').and.returnValue(Promise.reject(new Error('boom'))),
      });
      const controller = buildController(setters, { uploadClient: mockUploadClient });

      await controller.deletePhoto({ id: 35 }, 7);

      expect(setters.setDeletingPhotoId).toHaveBeenCalledWith(7);
      expect(setters.setDeletingPhotoId).toHaveBeenCalledWith(null);
      expect(setters.setItem).not.toHaveBeenCalled();

      const applyError = setters.setDeleteErrorByPhotoId.calls.mostRecent().args[0];
      expect(applyError({})).toEqual({ 7: 'Unable to delete photo.' });
    });

    it('sets a per-photo delete error and rejects when slug/id/photoId are missing', async function() {
      const setters = buildSetters();
      const mockUploadClient = buildMockUploadClient();
      const controller = buildController(setters, {
        client: buildMockClient({
          currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items'),
        }),
        uploadClient: mockUploadClient,
      });

      await expectAsync(controller.deletePhoto({ id: 35 }, 7)).toBeRejected();

      expect(mockUploadClient.delete).not.toHaveBeenCalled();
      expect(setters.setDeletingPhotoId).not.toHaveBeenCalled();

      const applyError = setters.setDeleteErrorByPhotoId.calls.mostRecent().args[0];
      expect(applyError({})).toEqual({ 7: 'Unable to delete photo.' });
    });
  });
});
