import CategoryItemEditController, { getCategoryItemEditParamsFromHash } from '../../../../assets/js/components/pages/controllers/CategoryItemEditController.js';
import {
  buildSpies,
  flushPromises,
} from '../../../support/factories.js';

describe('CategoryItemEditController', function() {
  let mockClient;
  let mockLocation;

  const buildMockClient = (overrides = {}) => ({
    currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items/35/edit'),
    fetch: jasmine.createSpy('fetch').and.callFake((path) => {
      if (path === '/categories/project/items/35.json') {
        return Promise.resolve({
          id: 35,
          name: 'Oak',
          description: 'A project item',
          category: { slug: 'project', name: 'Project' },
          kind: { slug: 'code', name: 'Code' },
          links: [],
        });
      }

      if (path === '/categories/project/kinds.json') {
        return Promise.resolve([{ slug: 'code', name: 'Code' }]);
      }

      return Promise.reject(new Error(`Unexpected path: ${path}`));
    }),
    patch: jasmine.createSpy('patch').and.returnValue(Promise.resolve({ id: 35 })),
    ...overrides,
  });

  const buildSetters = () => buildSpies(
    'setItem',
    'setKinds',
    'setLoading',
    'setSaving',
    'setError',
    'setUploading',
    'setUploadError',
    'setDeletingPhotoId',
    'setDeleteErrorByPhotoId'
  );

  const buildMockUploadClient = (overrides = {}) => ({
    upload: jasmine.createSpy('upload').and.returnValue(Promise.resolve({ id: 7, file_name: 'photo.png', ready: true })),
    delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve()),
    ...overrides,
  });

  const buildController = (setters, overrides = {}) => new CategoryItemEditController(
    {
      setItem: setters.setItem,
      setKinds: setters.setKinds,
      setLoading: setters.setLoading,
      setSaving: setters.setSaving,
      setError: setters.setError,
    },
    {
      setUploading: setters.setUploading,
      setUploadError: setters.setUploadError,
      setDeletingPhotoId: setters.setDeletingPhotoId,
      setDeleteErrorByPhotoId: setters.setDeleteErrorByPhotoId,
    },
    {
      client: overrides.client || mockClient,
      locationTarget: overrides.locationTarget || mockLocation,
      uploadClient: overrides.uploadClient || buildMockUploadClient(),
    }
  );

  beforeEach(function() {
    mockClient = buildMockClient();
    mockLocation = { hash: '#/categories/project/items/35/edit' };
  });

  describe('getCategoryItemEditParamsFromHash', function() {
    it('extracts slug and id from edit hash route', function() {
      const params = getCategoryItemEditParamsFromHash('#/categories/project/items/35/edit?page=2');

      expect(params).toEqual({ slug: 'project', id: '35' });
    });

    it('returns empty params when hash does not match the edit route', function() {
      const params = getCategoryItemEditParamsFromHash('#/categories/project/items/35');

      expect(params).toEqual({ slug: '', id: '' });
    });
  });

  it('loads item and kinds in buildEffect', async function() {
    const setters = buildSetters();
    const controller = buildController(setters);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(mockClient.fetch).toHaveBeenCalledWith('/categories/project/items/35.json');
    expect(mockClient.fetch).toHaveBeenCalledWith('/categories/project/kinds.json');
    expect(setters.setItem).toHaveBeenCalledWith(jasmine.objectContaining({
      id: 35,
      kind_slug: 'code',
      links: [],
    }));
    expect(setters.setKinds).toHaveBeenCalledWith([{ slug: 'code', name: 'Code' }]);
    expect(setters.setLoading).toHaveBeenCalledWith(false);
    expect(setters.setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets error when loading fails', async function() {
    const setters = buildSetters();
    mockClient = buildMockClient({
      fetch: jasmine.createSpy('fetch').and.returnValue(Promise.reject(new Error('boom'))),
    });
    const controller = buildController(setters);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setters.setError).toHaveBeenCalledWith('Unable to load category item edit form.');
    expect(setters.setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('saves payload and redirects to show page', async function() {
    const setters = buildSetters();
    const controller = buildController(setters);

    await controller.save({
      name: 'Oak Updated',
      description: 'Updated',
      kind_slug: 'code',
      visible: true,
      links: [{ id: 10, text: 'GitHub', url: 'https://github.com/darthjee/oak' }],
    });

    expect(mockClient.patch).toHaveBeenCalledWith('/categories/project/items/35.json', {
      item: {
        name: 'Oak Updated',
        description: 'Updated',
        kind_slug: 'code',
        visible: true,
        links: [{ id: 10, text: 'GitHub', url: 'https://github.com/darthjee/oak', order: 1 }],
      },
    });
    expect(mockLocation.hash).toBe('#/categories/project/items/35');
    expect(setters.setSaving).toHaveBeenCalledWith(true);
    expect(setters.setSaving).toHaveBeenCalledWith(false);
    expect(setters.setError).toHaveBeenCalledWith(null);
  });

  it('sets error when save fails', async function() {
    const setters = buildSetters();
    mockClient = buildMockClient({
      patch: jasmine.createSpy('patch').and.returnValue(Promise.reject(new Error('boom'))),
    });
    const controller = buildController(setters);

    await controller.save({
      name: 'Oak Updated',
      description: 'Updated',
      kind_slug: 'code',
      links: [],
    });

    expect(setters.setError).toHaveBeenCalledWith('Unable to save category item.');
    expect(setters.setSaving).toHaveBeenCalledWith(false);
  });

  describe('#uploadPhoto', function() {
    it('uploads the file and refetches the item on success', async function() {
      const setters = buildSetters();
      const mockUploadClient = buildMockUploadClient();
      const controller = buildController(setters, { uploadClient: mockUploadClient });
      const file = new Blob(['data'], { type: 'image/png' });

      await controller.uploadPhoto({ id: 35 }, file);

      expect(mockUploadClient.upload).toHaveBeenCalledWith('project', '35', file);
      expect(mockClient.fetch).toHaveBeenCalledWith('/categories/project/items/35.json');
      expect(setters.setItem).toHaveBeenCalledWith(jasmine.objectContaining({
        id: 35,
        kind_slug: 'code',
        links: [],
      }));
      expect(setters.setUploading).toHaveBeenCalledWith(true);
      expect(setters.setUploading).toHaveBeenCalledWith(false);
      expect(setters.setUploadError).toHaveBeenCalledWith(null);
      expect(setters.setUploadError).not.toHaveBeenCalledWith('Unable to upload photo.');
    });

    it('sets upload error when the upload fails', async function() {
      const setters = buildSetters();
      const mockUploadClient = buildMockUploadClient({
        upload: jasmine.createSpy('upload').and.returnValue(Promise.reject(new Error('boom'))),
      });
      const controller = buildController(setters, { uploadClient: mockUploadClient });
      const file = new Blob(['data'], { type: 'image/png' });

      await controller.uploadPhoto({ id: 35 }, file);

      expect(setters.setUploadError).toHaveBeenCalledWith('Unable to upload photo.');
      expect(setters.setUploading).toHaveBeenCalledWith(false);
      expect(setters.setItem).not.toHaveBeenCalled();
    });

    it('sets upload error and rejects when slug/id/file are missing', async function() {
      const setters = buildSetters();
      const mockUploadClient = buildMockUploadClient();
      mockClient = buildMockClient({
        currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items/35'),
      });
      const controller = buildController(setters, { uploadClient: mockUploadClient });

      await expectAsync(controller.uploadPhoto({ id: 35 }, null)).toBeRejected();

      expect(setters.setUploadError).toHaveBeenCalledWith('Unable to upload photo.');
      expect(mockUploadClient.upload).not.toHaveBeenCalled();
    });
  });

  describe('#deletePhoto', function() {
    it('deletes the photo and refetches the item on success', async function() {
      const setters = buildSetters();
      const mockUploadClient = buildMockUploadClient();
      const controller = buildController(setters, { uploadClient: mockUploadClient });

      await controller.deletePhoto({ id: 35 }, 7);

      expect(mockUploadClient.delete).toHaveBeenCalledWith('project', '35', 7);
      expect(mockClient.fetch).toHaveBeenCalledWith('/categories/project/items/35.json');
      expect(setters.setItem).toHaveBeenCalledWith(jasmine.objectContaining({
        id: 35,
        kind_slug: 'code',
        links: [],
      }));
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
      mockClient = buildMockClient({
        currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items/35'),
      });
      const controller = buildController(setters, { uploadClient: mockUploadClient });

      await expectAsync(controller.deletePhoto({ id: 35 }, 7)).toBeRejected();

      expect(mockUploadClient.delete).not.toHaveBeenCalled();
      expect(setters.setDeletingPhotoId).not.toHaveBeenCalled();

      const applyError = setters.setDeleteErrorByPhotoId.calls.mostRecent().args[0];
      expect(applyError({})).toEqual({ 7: 'Unable to delete photo.' });
    });
  });
});
