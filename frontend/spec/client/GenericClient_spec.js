import GenericClient from '../../assets/js/client/GenericClient.js';

describe('GenericClient', function() {
  let originalFetch;

  const buildResponseHeaders = (values = {}) => ({
    get(name) {
      return values[name] ?? null;
    },
  });

  beforeEach(function() {
    originalFetch = global.fetch;
  });

  afterEach(function() {
    global.fetch = originalFetch;
  });

  describe('#fetch', function() {
    it('returns parsed JSON body on success', async function() {
      global.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ name: 'Item' }),
        })
      );

      const client = new GenericClient(() => '');
      const result = await client.fetch('/items.json');

      expect(result).toEqual({ name: 'Item' });
      expect(global.fetch).toHaveBeenCalledWith('/items.json', { headers: { Accept: 'application/json' } });
    });

    it('appends hash query params to the URL', async function() {
      global.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      );

      const client = new GenericClient(() => '#/items?page=3');
      await client.fetch('/items.json');

      expect(global.fetch).toHaveBeenCalledWith('/items.json?page=3', { headers: { Accept: 'application/json' } });
    });

    it('does not append query string when hash has no params', async function() {
      global.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      );

      const client = new GenericClient(() => '#/items');
      await client.fetch('/items.json');

      expect(global.fetch).toHaveBeenCalledWith('/items.json', { headers: { Accept: 'application/json' } });
    });

    it('throws on non-ok response', async function() {
      global.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({ ok: false, status: 500 })
      );

      const client = new GenericClient(() => '');

      await expectAsync(client.fetch('/items.json')).toBeRejectedWithError('Request failed for /items.json');
    });
  });

  describe('#fetchIndex', function() {
    it('returns data and pagination on success', async function() {
      const headers = buildResponseHeaders({ page: '2', pages: '9', per_page: '12' });

      global.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({
          ok: true,
          headers,
          json: () => Promise.resolve([{ id: 1 }]),
        })
      );

      const client = new GenericClient(() => '');
      const result = await client.fetchIndex('/categories.json');

      expect(result).toEqual({
        data: [{ id: 1 }],
        pagination: { page: 2, pages: 9, perPage: 12 },
      });
      expect(global.fetch).toHaveBeenCalledWith('/categories.json', { headers: { Accept: 'application/json' } });
    });

    it('appends hash query params to the URL', async function() {
      const headers = buildResponseHeaders({ page: '1', pages: '1', per_page: '10' });

      global.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({
          ok: true,
          headers,
          json: () => Promise.resolve([]),
        })
      );

      const client = new GenericClient(() => '#/categories?page=2');
      await client.fetchIndex('/categories.json');

      expect(global.fetch).toHaveBeenCalledWith('/categories.json?page=2', { headers: { Accept: 'application/json' } });
    });

    it('does not append query string when hash has no params', async function() {
      const headers = buildResponseHeaders({ page: '1', pages: '1', per_page: '10' });

      global.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({
          ok: true,
          headers,
          json: () => Promise.resolve([]),
        })
      );

      const client = new GenericClient(() => '#/categories');
      await client.fetchIndex('/categories.json');

      expect(global.fetch).toHaveBeenCalledWith('/categories.json', { headers: { Accept: 'application/json' } });
    });

    it('falls back to defaults when pagination headers are absent', async function() {
      const headers = buildResponseHeaders();

      global.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({
          ok: true,
          headers,
          json: () => Promise.resolve([]),
        })
      );

      const client = new GenericClient(() => '');
      const result = await client.fetchIndex('/categories.json');

      expect(result.pagination).toEqual({ page: 1, pages: 1, perPage: 10 });
    });

    it('throws on non-ok response', async function() {
      global.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({ ok: false, status: 500 })
      );

      const client = new GenericClient(() => '');

      await expectAsync(client.fetchIndex('/categories.json')).toBeRejectedWithError('Request failed for /categories.json');
    });
  });
});
