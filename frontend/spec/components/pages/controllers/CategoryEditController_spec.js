import CategoryEditController, { getCategoryEditSlugFromHash } from '../../../../assets/js/components/pages/controllers/CategoryEditController.js';
import GenericClient from '../../../../assets/js/client/GenericClient.js';
import {
  buildSpies,
  flushPromises,
} from '../../../support/factories.js';

describe('CategoryEditController', function() {
  let mockClient;
  let mockLocation;

  const buildMockClient = (overrides = {}) => ({
    currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project/edit'),
    fetch: jasmine.createSpy('fetch').and.callFake((path) => {
      if (path === '/categories/project.json') {
        return Promise.resolve({
          slug: 'project',
          name: 'Project',
          kinds: [{ slug: 'code', name: 'Code' }],
        });
      }

      if (path === '/kinds.json') {
        return Promise.resolve([
          { slug: 'code', name: 'Code' },
          { slug: 'hardware', name: 'Hardware' },
        ]);
      }

      return Promise.reject(new Error(`Unexpected path: ${path}`));
    }),
    patch: jasmine.createSpy('patch').and.returnValue(Promise.resolve({ slug: 'project-edited' })),
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

    return new CategoryEditController(
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
    mockLocation = { hash: '#/categories/project/edit' };
  });

  describe('getCategoryEditSlugFromHash', function() {
    it('extracts category slug from edit hash route', function() {
      expect(getCategoryEditSlugFromHash('#/categories/project/edit?page=2')).toBe('project');
    });

    it('returns empty slug when hash does not match the edit route', function() {
      expect(getCategoryEditSlugFromHash('#/categories/project')).toBe('');
    });
  });

  it('loads category form and kinds in buildEffect', async function() {
    const setters = buildSetters();
    const cleanup = buildController(setters).buildEffect()();

    await flushPromises();

    expect(mockClient.fetch).toHaveBeenCalledWith('/categories/project.json');
    expect(mockClient.fetch).toHaveBeenCalledWith('/kinds.json');
    expect(setters.setCategory).toHaveBeenCalledWith({
      slug: 'project',
      name: 'Project',
      kinds: [{ slug: 'code', name: 'Code' }],
    });
    expect(setters.setKinds).toHaveBeenCalledWith([
      { slug: 'code', name: 'Code' },
      { slug: 'hardware', name: 'Hardware' },
    ]);
    expect(setters.setLoading).toHaveBeenCalledWith(false);
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

    expect(setters.setError).toHaveBeenCalledWith('Unable to load category edit form.');
    expect(setters.setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('patches payload and redirects to category page on save', async function() {
    const setters = buildSetters();

    await buildController(setters).save({
      name: 'Project Edited',
      kinds: [{ slug: 'code', name: 'Code' }],
    });

    expect(mockClient.patch).toHaveBeenCalledWith('/categories/project', {
      category: {
        name: 'Project Edited',
        kinds: [{ slug: 'code' }],
      },
    });
    expect(mockLocation.hash).toBe('#/categories/project-edited');
    expect(setters.setSaving).toHaveBeenCalledWith(true);
    expect(setters.setSaving).toHaveBeenCalledWith(false);
    expect(setters.setError).toHaveBeenCalledWith(null);
  });

  it('uses current slug when save response has no slug', async function() {
    mockClient = buildMockClient({
      patch: jasmine.createSpy('patch').and.returnValue(Promise.resolve({})),
    });
    const setters = buildSetters();

    await buildController(setters).save({ name: 'Project Edited', kinds: [] });

    expect(mockLocation.hash).toBe('#/categories/project');
  });

  it('sets error when save fails', async function() {
    mockClient = buildMockClient({
      patch: jasmine.createSpy('patch').and.returnValue(Promise.reject(new Error('boom'))),
    });
    const setters = buildSetters();

    await buildController(setters).save({ name: 'Project Edited', kinds: [] });

    expect(setters.setError).toHaveBeenCalledWith('Unable to save category.');
    expect(setters.setSaving).toHaveBeenCalledWith(false);
  });

  it('rejects and sets error when slug is missing on save', async function() {
    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/new'),
    });
    const setters = buildSetters();
    let caught = false;

    await buildController(setters).save({ name: 'Project Edited', kinds: [] }).catch(() => { caught = true; });

    expect(caught).toBe(true);
    expect(setters.setError).toHaveBeenCalledWith('Unable to save category.');
    expect(mockClient.patch).not.toHaveBeenCalled();
  });

  it('defaults client to a new GenericClient when none is provided', function() {
    const { setCategory, setKinds, setLoading, setSaving, setError } = buildSetters();
    const controller = new CategoryEditController(setCategory, setKinds, setLoading, setSaving, setError);

    expect(controller.client).toBeInstanceOf(GenericClient);
  });
});
