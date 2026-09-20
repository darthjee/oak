import KindEditController, { getKindEditSlugFromHash } from '../../../../assets/js/components/pages/controllers/KindEditController.js';
import GenericClient from '../../../../assets/js/client/GenericClient.js';
import {
  buildSpies,
  flushPromises,
} from '../../../support/factories.js';

describe('KindEditController', function() {
  let mockClient;
  let mockLocation;

  const buildMockClient = (overrides = {}) => ({
    currentHash: jasmine.createSpy('currentHash').and.returnValue('#/kinds/code/edit'),
    fetch: jasmine.createSpy('fetch').and.callFake((path) => {
      if (path === '/kinds/code/edit.json') {
        return Promise.resolve({ slug: 'code', name: 'Code' });
      }

      return Promise.reject(new Error(`Unexpected path: ${path}`));
    }),
    patch: jasmine.createSpy('patch').and.returnValue(Promise.resolve({ slug: 'code-edited' })),
    ...overrides,
  });

  const buildSetters = () => buildSpies(
    'setKind',
    'setLoading',
    'setSaving',
    'setError'
  );

  const buildController = (setters, client = null, location = null) => {
    const { setKind, setLoading, setSaving, setError } = setters;

    return new KindEditController(
      setKind,
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
    expect(setters.setKind).toHaveBeenCalledWith({ slug: 'code', name: 'Code' });
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

    expect(mockClient.fetch).not.toHaveBeenCalled();
    expect(setters.setError).toHaveBeenCalledWith('Unable to load kind edit form.');
    expect(setters.setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('patches payload and redirects to kind page on save', async function() {
    const setters = buildSetters();

    await buildController(setters).save({ name: 'Code Edited' });

    expect(mockClient.patch).toHaveBeenCalledWith('/kinds/code', {
      kind: { name: 'Code Edited' },
    });
    expect(mockLocation.hash).toBe('#/kinds/code-edited');
    expect(setters.setSaving).toHaveBeenCalledWith(true);
    expect(setters.setSaving).toHaveBeenCalledWith(false);
    expect(setters.setError).toHaveBeenCalledWith(null);
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
    const { setKind, setLoading, setSaving, setError } = buildSetters();
    const controller = new KindEditController(setKind, setLoading, setSaving, setError);

    expect(controller.client).toBeInstanceOf(GenericClient);
  });
});
