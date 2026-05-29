import CategoryController, { getCategorySlugFromHash } from '../../../../assets/js/components/pages/controllers/CategoryController.js';
import GenericClient from '../../../../assets/js/client/GenericClient.js';
import {
  buildSpies,
  flushPromises,
} from '../../../support/factories.js';

describe('CategoryController', function() {
  let mockClient;

  const buildMockClient = (overrides = {}) => ({
    currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project'),
    fetch: jasmine.createSpy('fetch').and.returnValue(
      Promise.resolve({ slug: 'project', name: 'Project', kinds: [] })
    ),
    ...overrides,
  });

  const buildSetters = () => buildSpies(
    'setCategory',
    'setLogged',
    'setLoading',
    'setError'
  );

  beforeEach(function() {
    mockClient = buildMockClient();
    spyOn(CategoryController.prototype, 'checkLogin').and.returnValue(Promise.resolve(true));
  });

  describe('getCategorySlugFromHash', function() {
    it('extracts slug from hash route', function() {
      const slug = getCategorySlugFromHash('#/categories/project?page=2');

      expect(slug).toBe('project');
    });

    it('extracts slug from a route with trailing slash', function() {
      const slug = getCategorySlugFromHash('#/categories/project/?page=2');

      expect(slug).toBe('project');
    });

    it('returns empty slug when hash does not match category route', function() {
      const slug = getCategorySlugFromHash('#/categories');

      expect(slug).toBe('');
    });
  });

  it('fetches category in buildEffect', async function() {
    const { setCategory, setLogged, setLoading, setError } = buildSetters();
    const category = {
      slug: 'project',
      name: 'Project',
      kinds: [{ slug: 'code', name: 'Code' }],
    };

    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories/project?foo=bar'),
      fetch: jasmine.createSpy('fetch').and.returnValue(Promise.resolve(category)),
    });

    const controller = new CategoryController(setCategory, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(mockClient.fetch).toHaveBeenCalledWith('/categories/project.json');
    expect(setCategory).toHaveBeenCalledWith(category);
    expect(setLogged).toHaveBeenCalledWith(true);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('normalizes missing kinds to an empty array', async function() {
    const { setCategory, setLogged, setLoading, setError } = buildSetters();

    mockClient = buildMockClient({
      fetch: jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({ slug: 'project', name: 'Project' })
      ),
    });

    const controller = new CategoryController(setCategory, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setCategory).toHaveBeenCalledWith({ slug: 'project', name: 'Project', kinds: [] });
    expect(setError).not.toHaveBeenCalled();
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('calls setError when category fetch fails', async function() {
    const { setCategory, setLogged, setLoading, setError } = buildSetters();

    mockClient = buildMockClient({
      fetch: jasmine.createSpy('fetch').and.returnValue(
        Promise.reject(new Error('Request failed for /categories/project.json'))
      ),
    });

    const controller = new CategoryController(setCategory, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(setCategory).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Unable to load category.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('calls setError when params cannot be extracted from hash', async function() {
    const { setCategory, setLogged, setLoading, setError } = buildSetters();

    mockClient = buildMockClient({
      currentHash: jasmine.createSpy('currentHash').and.returnValue('#/categories'),
    });

    const controller = new CategoryController(setCategory, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    await flushPromises();

    expect(mockClient.fetch).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Unable to load category.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('does not call setters after unmount', async function() {
    const { setCategory, setLogged, setLoading, setError } = buildSetters();

    const controller = new CategoryController(setCategory, setLogged, setLoading, setError, mockClient);
    const cleanup = controller.buildEffect()();

    cleanup();

    await flushPromises();

    expect(setCategory).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();
  });

  it('defaults client to a new GenericClient when none is provided', function() {
    const { setCategory, setLogged, setLoading, setError } = buildSetters();

    const controller = new CategoryController(setCategory, setLogged, setLoading, setError);

    expect(controller.client).toBeInstanceOf(GenericClient);
  });
});
