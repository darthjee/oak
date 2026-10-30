import KindEditController, { getKindEditSlugFromHash } from '../../../../assets/js/components/pages/controllers/KindEditController.js';
import GenericClient from '../../../../assets/js/client/GenericClient.js';
import {
  buildSpies,
  flushPromises,
} from '../../../support/factories.js';

describe('KindEditController', function() {
  const CATEGORIES_PATH = '/categories.json?filters[include_empty]=true';
  const availableCategories = [{ slug: 'books', name: 'Books', snap_url: null }];

  let mockClient;
  let mockLocation;

  const buildMockClient = (overrides = {}) => ({
    currentHash: jasmine.createSpy('currentHash').and.returnValue('#/kinds/code/edit'),
    fetch: jasmine.createSpy('fetch').and.callFake((path) => {
      if (path === '/kinds/code/edit.json') {
        return Promise.resolve({ slug: 'code', name: 'Code' });
      }

      if (path === CATEGORIES_PATH) {
        return Promise.resolve(availableCategories);
      }

      return Promise.reject(new Error(`Unexpected path: ${path}`));
    }),
    patch: jasmine.createSpy('patch').and.returnValue(Promise.resolve({ slug: 'code-edited' })),
    ...overrides,
  });

  const buildSetters = () => buildSpies(
    'setKind',
    'setCategories',
    'setLoading',
    'setSaving',
    'setError'
  );

  const buildController = (setters, client = null, location = null) => {
    const { setKind, setCategories, setLoading, setSaving, setError } = setters;

    return new KindEditController(
      setKind,
      setCategories,
      setLoading,
      setSaving,
      setError,
      client ?? mockClient,
      location ?? mockLocation
    );
  };

  beforeEach(function() {
    mockClient = buildMockClient();
    mockLocation = { hash: '#/kinds/code/edit' };
  });

  describe('getKindEditSlugFromHash', function() {
    it('extracts kind slug from edit hash route', function() {
      expect(getKindEditSlugFromHash('#/kinds/code/edit?page=2')).toBe('code');
    });

    it('returns empty slug when hash does not match the edit route', function() {
      expect(getKindEditSlugFromHash('#/kinds/code')).toBe('');
    });
  });

  it('loads kind form in buildEffect', async function() {
    const setters = buildSetters();
    const cleanup = buildController(setters).buildEffect()();

    await flushPromises();

    expect(mockClient.fetch).toHaveBeenCalledWith('/kinds/code/edit.json');
    expect(mockClient.fetch).toHaveBeenCalledWith(CATEGORIES_PATH);
    expect(setters.setKind).toHaveBeenCalledWith({ slug: 'code', name: 'Code', categories: [] });
    expect(setters.setCategories).toHaveBeenCalledWith(availableCategories);
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

    expect(setters.setError).toHaveBeenCalledWith('Unable to load kind edit form.');
    expect(setters.setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('sets error when slug cannot be resolved from hash', async function() {
    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/kinds/code'),
    });
    const setters = buildSetters();
    const cleanup = buildController(setters).buildEffect()();

    await flushPromises();

    expect(mockClient.fetch.calls.allArgs()).toEqual([[CATEGORIES_PATH]]);
    expect(setters.setError).toHaveBeenCalledWith('Unable to load kind edit form.');
    expect(setters.setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('patches payload and redirects to kind page on save', async function() {
    const setters = buildSetters();

    await buildController(setters).save({ name: 'Code Edited' });

    expect(mockClient.patch).toHaveBeenCalledWith('/kinds/code', {
      kind: { name: 'Code Edited', categories: [] },
    });
    expect(mockLocation.hash).toBe('#/kinds/code-edited');
    expect(setters.setSaving).toHaveBeenCalledWith(true);
    expect(setters.setSaving).toHaveBeenCalledWith(false);
    expect(setters.setError).toHaveBeenCalledWith(null);
  });

  it('sets error when loading categories fails', async function() {
    mockClient = buildMockClient({
      fetch: jasmine.createSpy('fetch').and.callFake((path) => (
        path === CATEGORIES_PATH
          ? Promise.reject(new Error('boom'))
          : Promise.resolve({ slug: 'code', name: 'Code' })
      )),
    });
    const setters = buildSetters();
    const cleanup = buildController(setters).buildEffect()();

    await flushPromises();

    expect(setters.setError).toHaveBeenCalledWith('Unable to load kind edit form.');
    expect(setters.setKind).not.toHaveBeenCalled();
    expect(setters.setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('patches selected category slugs, sending an empty list when none are selected', async function() {
    const setters = buildSetters();
    const controller = buildController(setters);

    await controller.save({ name: 'Code', categories: [{ slug: 'books', name: 'Books' }] });
    await controller.save({ name: 'Code', categories: [] });

    expect(mockClient.patch.calls.argsFor(0)).toEqual([
      '/kinds/code', { kind: { name: 'Code', categories: [{ slug: 'books' }] } },
    ]);
    expect(mockClient.patch.calls.argsFor(1)).toEqual([
      '/kinds/code', { kind: { name: 'Code', categories: [] } },
    ]);
  });

  it('uses current slug when save response has no slug', async function() {
    mockClient = buildMockClient({
      patch: jasmine.createSpy('patch').and.returnValue(Promise.resolve({})),
    });
    const setters = buildSetters();

    await buildController(setters).save({ name: 'Code Edited' });

    expect(mockLocation.hash).toBe('#/kinds/code');
  });

  it('sets error when save fails', async function() {
    mockClient = buildMockClient({
      patch: jasmine.createSpy('patch').and.returnValue(Promise.reject(new Error('boom'))),
    });
    const setters = buildSetters();

    await buildController(setters).save({ name: 'Code Edited' });

    expect(setters.setError).toHaveBeenCalledWith('Unable to save kind.');
    expect(setters.setSaving).toHaveBeenCalledWith(false);
  });

  it('rejects and sets error when slug is missing on save', async function() {
    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/kinds/new'),
    });
    const setters = buildSetters();
    let caught = false;

    await buildController(setters).save({ name: 'Code Edited' }).catch(() => { caught = true; });

    expect(caught).toBe(true);
    expect(setters.setError).toHaveBeenCalledWith('Unable to save kind.');
    expect(mockClient.patch).not.toHaveBeenCalled();
  });

  it('defaults client to a new GenericClient when none is provided', function() {
    const { setKind, setCategories, setLoading, setSaving, setError } = buildSetters();
    const controller = new KindEditController(setKind, setCategories, setLoading, setSaving, setError);

    expect(controller.client).toBeInstanceOf(GenericClient);
  });
});
