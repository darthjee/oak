import CategoryNewController from '../../../../assets/js/components/pages/controllers/CategoryNewController.js';
import GenericClient from '../../../../assets/js/client/GenericClient.js';
import {
  buildSpies,
  flushPromises,
} from '../../../support/factories.js';

describe('CategoryNewController', function() {
  let mockClient;
  let mockLocation;

  const buildMockClient = (overrides = {}) => ({
    currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/new'),
    fetch: jasmine.createSpy('fetch').and.callFake((path) => {
      if (path === '/categories/new.json') {
        return Promise.resolve({ name: '', slug: '', kinds: [] });
      }

      if (path === '/kinds.json') {
        return Promise.resolve([
          { slug: 'code', name: 'Code' },
          { slug: 'hardware', name: 'Hardware' },
        ]);
      }

      return Promise.reject(new Error(`Unexpected path: ${path}`));
    }),
    post: jasmine.createSpy('post').and.returnValue(Promise.resolve({ slug: 'my-category' })),
    ...overrides,
  });

  const buildSetters = () => buildSpies(
    'setCategory',
    'setKinds',
    'setLoading',
    'setSaving',
    'setError'
  );

  const buildController = (setters, client = null, location = null) => {
    const { setCategory, setKinds, setLoading, setSaving, setError } = setters;

    return new CategoryNewController(
      setCategory,
      setKinds,
      setLoading,
      setSaving,
      setError,
      client ?? mockClient,
      location ?? mockLocation
    );
  };

  beforeEach(function() {
    mockClient = buildMockClient();
    mockLocation = { hash: '#/categories/new' };
  });

  it('loads new category form and all kinds in buildEffect', async function() {
    const setters = buildSetters();
    const { setCategory, setKinds, setLoading, setError } = setters;
    const cleanup = buildController(setters).buildEffect()();

    await flushPromises();

    expect(mockClient.fetch).toHaveBeenCalledWith('/categories/new.json');
    expect(mockClient.fetch).toHaveBeenCalledWith('/kinds.json');
    expect(setCategory).toHaveBeenCalledWith(jasmine.objectContaining({ name: '', kinds: [] }));
    expect(setKinds).toHaveBeenCalledWith([
      { slug: 'code', name: 'Code' },
      { slug: 'hardware', name: 'Hardware' },
    ]);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('normalizes missing kinds to an empty array', async function() {
    mockClient = buildMockClient({
      fetch: jasmine.createSpy('fetch').and.callFake((path) => {
        if (path === '/categories/new.json') {
          return Promise.resolve({ name: '', slug: '' });
        }

        return Promise.resolve([]);
      }),
    });
    const setters = buildSetters();
    const cleanup = buildController(setters).buildEffect()();

    await flushPromises();

    expect(setters.setCategory).toHaveBeenCalledWith(
      jasmine.objectContaining({ name: '', kinds: [] })
    );
    expect(setters.setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets error when loading fails', async function() {
    mockClient = buildMockClient({
      fetch: jasmine.createSpy('fetch').and.returnValue(Promise.reject(new Error('boom'))),
    });
    const setters = buildSetters();
    const cleanup = buildController(setters).buildEffect()();

    await flushPromises();

    expect(setters.setError).toHaveBeenCalledWith('Unable to load category new form.');
    expect(setters.setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('does not call setters after unmount', async function() {
    const setters = buildSetters();
    const cleanup = buildController(setters).buildEffect()();

    cleanup();

    await flushPromises();

    expect(setters.setCategory).not.toHaveBeenCalled();
    expect(setters.setLoading).not.toHaveBeenCalled();
    expect(setters.setError).not.toHaveBeenCalled();
  });

  it('posts payload and redirects to category page on save', async function() {
    const setters = buildSetters();

    await buildController(setters).save({
      name: 'My Category',
      kinds: [{ slug: 'code', name: 'Code' }],
    });

    expect(mockClient.post).toHaveBeenCalledWith('/categories.json', {
      category: {
        name: 'My Category',
        kinds: [{ slug: 'code' }],
      },
    });
    expect(mockLocation.hash).toBe('#/categories/my-category');
    expect(setters.setSaving).toHaveBeenCalledWith(true);
    expect(setters.setSaving).toHaveBeenCalledWith(false);
    expect(setters.setError).toHaveBeenCalledWith(null);
  });

  it('sets error when save fails', async function() {
    mockClient = buildMockClient({
      post: jasmine.createSpy('post').and.returnValue(Promise.reject(new Error('boom'))),
    });
    const setters = buildSetters();

    await buildController(setters).save({ name: 'My Category', kinds: [] });

    expect(setters.setError).toHaveBeenCalledWith('Unable to save category.');
    expect(setters.setSaving).toHaveBeenCalledWith(false);
  });

  it('rejects and sets error when category is null on save', async function() {
    const setters = buildSetters();
    let caught = false;

    await buildController(setters).save(null).catch(() => { caught = true; });

    expect(caught).toBe(true);
    expect(setters.setError).toHaveBeenCalledWith('Unable to save category.');
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  describe('#onFieldChange', function() {
    it('updates the specified field on the category', function() {
      const setters = buildSetters();
      const controller = buildController(setters);

      controller.onFieldChange('name', 'Updated Name');

      const updater = setters.setCategory.calls.mostRecent().args[0];

      expect(updater({ name: 'Old', kinds: [] })).toEqual({ name: 'Updated Name', kinds: [] });
    });
  });

  describe('#onAddKind', function() {
    it('adds a kind to the category kinds list', function() {
      const setters = buildSetters();
      const controller = buildController(setters);

      controller.onAddKind({ slug: 'code', name: 'Code' });

      const updater = setters.setCategory.calls.mostRecent().args[0];

      expect(updater({ name: 'Cat', kinds: [] })).toEqual({
        name: 'Cat',
        kinds: [{ slug: 'code', name: 'Code' }],
      });
    });

    it('does not add a duplicate kind', function() {
      const setters = buildSetters();
      const controller = buildController(setters);
      const state = { name: 'Cat', kinds: [{ slug: 'code', name: 'Code' }] };

      controller.onAddKind({ slug: 'code', name: 'Code' });

      expect(setters.setCategory.calls.mostRecent().args[0](state)).toEqual(state);
    });

    it('does nothing when kind is null', function() {
      const setters = buildSetters();

      buildController(setters).onAddKind(null);

      expect(setters.setCategory).not.toHaveBeenCalled();
    });
  });

  describe('#onRemoveKind', function() {
    it('removes the kind with the given slug', function() {
      const setters = buildSetters();
      const controller = buildController(setters);

      controller.onRemoveKind('code');

      const updater = setters.setCategory.calls.mostRecent().args[0];

      expect(updater({
        name: 'Cat',
        kinds: [{ slug: 'code', name: 'Code' }, { slug: 'hardware', name: 'Hardware' }],
      })).toEqual({
        name: 'Cat',
        kinds: [{ slug: 'hardware', name: 'Hardware' }],
      });
    });
  });

  describe('#cancelHref', function() {
    it('returns the categories index href', function() {
      expect(buildController(buildSetters()).cancelHref()).toBe('/#/categories');
    });
  });

  it('defaults client to a new GenericClient when none is provided', function() {
    const { setCategory, setKinds, setLoading, setSaving, setError } = buildSetters();
    const controller = new CategoryNewController(
      setCategory, setKinds, setLoading, setSaving, setError
    );

    expect(controller.client).toBeInstanceOf(GenericClient);
  });
});
