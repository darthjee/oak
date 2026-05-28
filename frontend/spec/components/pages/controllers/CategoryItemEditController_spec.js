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
    'setError'
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
    const { setItem, setKinds, setLoading, setSaving, setError } = buildSetters();
    const controller = new CategoryItemEditController(
      setItem,
      setKinds,
      setLoading,
      setSaving,
      setError,
      mockClient,
      mockLocation
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(mockClient.fetch).toHaveBeenCalledWith('/categories/project/items/35.json');
    expect(mockClient.fetch).toHaveBeenCalledWith('/categories/project/kinds.json');
    expect(setItem).toHaveBeenCalledWith(jasmine.objectContaining({
      id: 35,
      kind_slug: 'code',
      links: [],
    }));
    expect(setKinds).toHaveBeenCalledWith([{ slug: 'code', name: 'Code' }]);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets error when loading fails', async function() {
    const { setItem, setKinds, setLoading, setSaving, setError } = buildSetters();
    mockClient = buildMockClient({
      fetch: jasmine.createSpy('fetch').and.returnValue(Promise.reject(new Error('boom'))),
    });
    const controller = new CategoryItemEditController(
      setItem,
      setKinds,
      setLoading,
      setSaving,
      setError,
      mockClient,
      mockLocation
    );
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setError).toHaveBeenCalledWith('Unable to load category item edit form.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('saves payload and redirects to show page', async function() {
    const { setItem, setKinds, setLoading, setSaving, setError } = buildSetters();
    const controller = new CategoryItemEditController(
      setItem,
      setKinds,
      setLoading,
      setSaving,
      setError,
      mockClient,
      mockLocation
    );

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
    expect(setSaving).toHaveBeenCalledWith(true);
    expect(setSaving).toHaveBeenCalledWith(false);
    expect(setError).toHaveBeenCalledWith(null);
  });

  it('sets error when save fails', async function() {
    const { setItem, setKinds, setLoading, setSaving, setError } = buildSetters();
    mockClient = buildMockClient({
      patch: jasmine.createSpy('patch').and.returnValue(Promise.reject(new Error('boom'))),
    });
    const controller = new CategoryItemEditController(
      setItem,
      setKinds,
      setLoading,
      setSaving,
      setError,
      mockClient,
      mockLocation
    );

    await controller.save({
      name: 'Oak Updated',
      description: 'Updated',
      kind_slug: 'code',
      links: [],
    });

    expect(setError).toHaveBeenCalledWith('Unable to save category item.');
    expect(setSaving).toHaveBeenCalledWith(false);
  });
});
