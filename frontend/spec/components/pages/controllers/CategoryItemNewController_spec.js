import CategoryItemNewController, { getCategoryItemNewParamsFromHash } from '../../../../assets/js/components/pages/controllers/CategoryItemNewController.js';
import {
  buildSpies,
  flushPromises,
} from '../../../support/factories.js';

describe('CategoryItemNewController', function() {
  let mockClient;
  let mockLocation;

  const buildMockClient = (overrides = {}) => ({
    currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/items/new'),
    fetch: jasmine.createSpy('fetch').and.callFake((path) => {
      if (path === '/categories/project/items/new.json') {
        return Promise.resolve({
          name: '',
          description: '',
          category: { slug: 'project', name: 'Project' },
          kind: null,
          links: [],
        });
      }

      if (path === '/categories/project/kinds.json') {
        return Promise.resolve([{ slug: 'code', name: 'Code' }]);
      }

      return Promise.reject(new Error(`Unexpected path: ${path}`));
    }),
    post: jasmine.createSpy('post').and.returnValue(Promise.resolve({ id: 36 })),
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
    mockLocation = { hash: '#/categories/project/items/new' };
  });

  describe('getCategoryItemNewParamsFromHash', function() {
    it('extracts slug from new item hash route', function() {
      const params = getCategoryItemNewParamsFromHash('#/categories/project/items/new');

      expect(params).toEqual({ slug: 'project' });
    });

    it('returns empty slug when hash does not match the new route', function() {
      const params = getCategoryItemNewParamsFromHash('#/categories/project/items/35');

      expect(params).toEqual({ slug: '' });
    });
  });

  it('loads new item form and kinds in buildEffect', async function() {
    const { setItem, setKinds, setLoading, setSaving, setError } = buildSetters();
    const controller = new CategoryItemNewController(
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

    expect(mockClient.fetch).toHaveBeenCalledWith('/categories/project/items/new.json');
    expect(mockClient.fetch).toHaveBeenCalledWith('/categories/project/kinds.json');
    expect(setItem).toHaveBeenCalledWith(jasmine.objectContaining({
      name: '',
      kind_slug: '',
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
    const controller = new CategoryItemNewController(
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

    expect(setError).toHaveBeenCalledWith('Unable to load category item new form.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('posts payload and redirects to items index page', async function() {
    const { setItem, setKinds, setLoading, setSaving, setError } = buildSetters();
    const controller = new CategoryItemNewController(
      setItem,
      setKinds,
      setLoading,
      setSaving,
      setError,
      mockClient,
      mockLocation
    );

    await controller.save({
      name: 'New Oak',
      description: 'A new project item',
      kind_slug: 'code',
      visible: true,
      links: [{ id: undefined, text: 'GitHub', url: 'https://github.com/darthjee/oak' }],
    });

    expect(mockClient.post).toHaveBeenCalledWith('/categories/project/items.json', {
      item: {
        name: 'New Oak',
        description: 'A new project item',
        kind_slug: 'code',
        visible: true,
        links: [{ id: undefined, text: 'GitHub', url: 'https://github.com/darthjee/oak', order: 1 }],
      },
    });
    expect(mockLocation.hash).toBe('#/categories/project/items');
    expect(setSaving).toHaveBeenCalledWith(true);
    expect(setSaving).toHaveBeenCalledWith(false);
    expect(setError).toHaveBeenCalledWith(null);
  });

  it('sets error when save fails', async function() {
    const { setItem, setKinds, setLoading, setSaving, setError } = buildSetters();
    mockClient = buildMockClient({
      post: jasmine.createSpy('post').and.returnValue(Promise.reject(new Error('boom'))),
    });
    const controller = new CategoryItemNewController(
      setItem,
      setKinds,
      setLoading,
      setSaving,
      setError,
      mockClient,
      mockLocation
    );

    await controller.save({
      name: 'New Oak',
      description: 'A new project item',
      kind_slug: 'code',
      links: [],
    });

    expect(setError).toHaveBeenCalledWith('Unable to save category item.');
    expect(setSaving).toHaveBeenCalledWith(false);
  });
});
