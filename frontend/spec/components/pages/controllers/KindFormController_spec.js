import KindFormController from '../../../../assets/js/components/pages/controllers/KindFormController.js';
import { buildSpies } from '../../../support/factories.js';

describe('KindFormController', function() {
  let setters;
  let client;
  let controller;

  beforeEach(function() {
    setters = buildSpies('setKind', 'setCategories', 'setLoading', 'setSaving', 'setError');
    client = { fetch: jasmine.createSpy('fetch') };
    controller = new KindFormController(
      setters.setKind,
      setters.setCategories,
      setters.setLoading,
      setters.setSaving,
      setters.setError,
      client,
      { hash: '' }
    );
  });

  const lastUpdater = () => setters.setKind.calls.mostRecent().args[0];

  describe('#normalizeKind', function() {
    it('defaults name and categories', function() {
      expect(controller.normalizeKind({ slug: 'code' })).toEqual({
        slug: 'code', name: '', categories: [],
      });
    });

    it('replaces non-array categories with an empty list', function() {
      expect(controller.normalizeKind({ name: 'Code', categories: 'x' }).categories).toEqual([]);
    });

    it('keeps array categories', function() {
      const categories = [{ slug: 'books', name: 'Books' }];

      expect(controller.normalizeKind({ name: 'Code', categories }).categories).toBe(categories);
    });
  });

  describe('#buildPayload', function() {
    it('sends category slugs only', function() {
      expect(controller.buildPayload({
        name: 'Code',
        categories: [{ slug: 'books', name: 'Books', snap_url: null }],
      })).toEqual({ kind: { name: 'Code', categories: [{ slug: 'books' }] } });
    });

    it('always sends categories, even when missing', function() {
      expect(controller.buildPayload({})).toEqual({ kind: { name: '', categories: [] } });
    });
  });

  describe('#onAddCategory', function() {
    it('appends a new category', function() {
      controller.onAddCategory({ slug: 'books', name: 'Books' });

      expect(lastUpdater()({ name: 'Code', categories: [] })).toEqual({
        name: 'Code', categories: [{ slug: 'books', name: 'Books' }],
      });
    });

    it('handles a kind without categories', function() {
      controller.onAddCategory({ slug: 'books', name: 'Books' });

      expect(lastUpdater()({ name: 'Code' }).categories).toEqual([{ slug: 'books', name: 'Books' }]);
    });

    it('does not duplicate an already selected category', function() {
      const state = { name: 'Code', categories: [{ slug: 'books', name: 'Books' }] };

      controller.onAddCategory({ slug: 'books', name: 'Books' });

      expect(lastUpdater()(state)).toBe(state);
    });

    it('ignores null or slug-less categories', function() {
      controller.onAddCategory(null);
      controller.onAddCategory({ name: 'No slug' });

      expect(setters.setKind).not.toHaveBeenCalled();
    });
  });

  describe('#onRemoveCategory', function() {
    it('removes the category with the given slug', function() {
      controller.onRemoveCategory('books');

      expect(lastUpdater()({
        name: 'Code',
        categories: [{ slug: 'books', name: 'Books' }, { slug: 'games', name: 'Games' }],
      })).toEqual({ name: 'Code', categories: [{ slug: 'games', name: 'Games' }] });
    });

    it('handles a kind without categories', function() {
      controller.onRemoveCategory('books');

      expect(lastUpdater()({ name: 'Code' })).toEqual({ name: 'Code', categories: [] });
    });
  });

  describe('#fetchCategories', function() {
    it('fetches categories including empty ones', async function() {
      const categories = [{ slug: 'books', name: 'Books' }];
      client.fetch.and.returnValue(Promise.resolve(categories));

      const result = await controller.fetchCategories('err');

      expect(client.fetch).toHaveBeenCalledWith('/categories.json?filters[include_empty]=true');
      expect(result).toBe(categories);
    });

    it('returns an empty list for non-array responses', async function() {
      client.fetch.and.returnValue(Promise.resolve(null));

      expect(await controller.fetchCategories('err')).toEqual([]);
    });

    it('rejects with the given message when the request fails', async function() {
      client.fetch.and.returnValue(Promise.reject(new Error('boom')));

      await expectAsync(controller.fetchCategories('Custom error')).toBeRejectedWithError('Custom error');
    });
  });

  describe('#applyLoadedData', function() {
    it('sets kind and categories through safeSet', function() {
      const safeSet = jasmine.createSpy('safeSet').and.callFake((setter, value) => setter(value));
      const kind = { name: 'Code', categories: [] };
      const categories = [{ slug: 'books', name: 'Books' }];

      controller.applyLoadedData(safeSet, kind, categories);

      expect(setters.setKind).toHaveBeenCalledWith(kind);
      expect(setters.setCategories).toHaveBeenCalledWith(categories);
    });
  });
});
