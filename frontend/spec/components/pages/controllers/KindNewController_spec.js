import KindNewController from '../../../../assets/js/components/pages/controllers/KindNewController.js';
import GenericClient from '../../../../assets/js/client/GenericClient.js';
import {
  buildSpies,
  flushPromises,
} from '../../../support/factories.js';

describe('KindNewController', function() {
  let mockClient;
  let mockLocation;

  const buildMockClient = (overrides = {}) => ({
    currentHash: jasmine.createSpy('currentHash').and.returnValue('#/kinds/new'),
    fetch: jasmine.createSpy('fetch').and.callFake((path) => {
      if (path === '/kinds/new.json') {
        return Promise.resolve({ name: '', slug: '' });
      }

      return Promise.reject(new Error(`Unexpected path: ${path}`));
    }),
    post: jasmine.createSpy('post').and.returnValue(Promise.resolve({ slug: 'my-kind' })),
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

    return new KindNewController(
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
    mockLocation = { hash: '#/kinds/new' };
  });

  it('loads new kind form in buildEffect', async function() {
    const setters = buildSetters();
    const { setKind, setLoading, setError } = setters;
    const cleanup = buildController(setters).buildEffect()();

    await flushPromises();

    expect(mockClient.fetch).toHaveBeenCalledWith('/kinds/new.json');
    expect(setKind).toHaveBeenCalledWith(jasmine.objectContaining({ name: '' }));
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('normalizes missing name to an empty string', async function() {
    mockClient = buildMockClient({
      fetch: jasmine.createSpy('fetch').and.returnValue(Promise.resolve({ slug: '' })),
    });
    const setters = buildSetters();
    const cleanup = buildController(setters).buildEffect()();

    await flushPromises();

    expect(setters.setKind).toHaveBeenCalledWith(jasmine.objectContaining({ name: '' }));
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

    expect(setters.setError).toHaveBeenCalledWith('Unable to load kind new form.');
    expect(setters.setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('does not call setters after unmount', async function() {
    const setters = buildSetters();
    const cleanup = buildController(setters).buildEffect()();

    cleanup();

    await flushPromises();

    expect(setters.setKind).not.toHaveBeenCalled();
    expect(setters.setLoading).not.toHaveBeenCalled();
    expect(setters.setError).not.toHaveBeenCalled();
  });

  it('posts payload and redirects to kind page on save', async function() {
    const setters = buildSetters();

    await buildController(setters).save({ name: 'My Kind' });

    expect(mockClient.post).toHaveBeenCalledWith('/kinds.json', {
      kind: { name: 'My Kind' },
    });
    expect(mockLocation.hash).toBe('#/kinds/my-kind');
    expect(setters.setSaving).toHaveBeenCalledWith(true);
    expect(setters.setSaving).toHaveBeenCalledWith(false);
    expect(setters.setError).toHaveBeenCalledWith(null);
  });

  it('sets error when save fails', async function() {
    mockClient = buildMockClient({
      post: jasmine.createSpy('post').and.returnValue(Promise.reject(new Error('boom'))),
    });
    const setters = buildSetters();

    await buildController(setters).save({ name: 'My Kind' });

    expect(setters.setError).toHaveBeenCalledWith('Unable to save kind.');
    expect(setters.setSaving).toHaveBeenCalledWith(false);
  });

  it('rejects and sets error when kind is null on save', async function() {
    const setters = buildSetters();
    let caught = false;

    await buildController(setters).save(null).catch(() => { caught = true; });

    expect(caught).toBe(true);
    expect(setters.setError).toHaveBeenCalledWith('Unable to save kind.');
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  describe('#onFieldChange', function() {
    it('updates the specified field on the kind', function() {
      const setters = buildSetters();
      const controller = buildController(setters);

      controller.onFieldChange('name', 'Updated Name');

      const updater = setters.setKind.calls.mostRecent().args[0];

      expect(updater({ name: 'Old' })).toEqual({ name: 'Updated Name' });
    });
  });

  describe('#cancelHref', function() {
    it('returns the kinds index href', function() {
      expect(buildController(buildSetters()).cancelHref()).toBe('/#/kinds');
    });
  });

  it('defaults client to a new GenericClient when none is provided', function() {
    const { setKind, setLoading, setSaving, setError } = buildSetters();
    const controller = new KindNewController(
      setKind, setLoading, setSaving, setError
    );

    expect(controller.client).toBeInstanceOf(GenericClient);
  });
});
