import GenericClient from '../../assets/js/client/GenericClient.js';
import { preserveGlobals, stubFetchResponse } from '../support/factories.js';

describe('GenericClient', function() {
  let restoreGlobals;

  const buildResponseHeaders = (values = {}) => ({
    get(name) {
      return values[name] ?? null;
    },
  });

  const stubJsonResponse = (data, extra = {}) => stubFetchResponse({
    ok: true,
    json: () => Promise.resolve(data),
    ...extra,
  });

  beforeEach(function() {
    restoreGlobals = preserveGlobals('fetch');
  });

  afterEach(function() {
    restoreGlobals();
  });

  describe('#fetch', function() {
    it('returns parsed JSON body on success', async function() {
      stubJsonResponse({ name: 'Item' });

      const client = new GenericClient(() => '');
      const result = await client.fetch('/items.json');

      expect(result).toEqual({ name: 'Item' });
      expect(global.fetch).toHaveBeenCalledWith('/items.json', { headers: { Accept: 'application/json' } });
    });

    it('appends hash query params to the URL', async function() {
      stubJsonResponse([]);

      const client = new GenericClient(() => '#/items?page=3');
      await client.fetch('/items.json');

      expect(global.fetch).toHaveBeenCalledWith('/items.json?page=3', { headers: { Accept: 'application/json' } });
    });

    it('does not append query string when hash has no params', async function() {
      stubJsonResponse([]);

      const client = new GenericClient(() => '#/items');
      await client.fetch('/items.json');

      expect(global.fetch).toHaveBeenCalledWith('/items.json', { headers: { Accept: 'application/json' } });
    });

    it('throws on non-ok response', async function() {
      stubFetchResponse({ ok: false, status: 500 });

      const client = new GenericClient(() => '');

      await expectAsync(client.fetch('/items.json')).toBeRejectedWithError('Request failed for /items.json');
    });
  });

  describe('#fetchIndex', function() {
    it('returns data and pagination on success', async function() {
      const headers = buildResponseHeaders({ page: '2', pages: '9', per_page: '12' });

      stubJsonResponse([{ id: 1 }], { headers });

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

      stubJsonResponse([], { headers });

      const client = new GenericClient(() => '#/categories?page=2');
      await client.fetchIndex('/categories.json');

      expect(global.fetch).toHaveBeenCalledWith('/categories.json?page=2', { headers: { Accept: 'application/json' } });
    });

    it('appends only pagination query params to index URLs', async function() {
      const headers = buildResponseHeaders({ page: '1', pages: '1', per_page: '10' });

      stubJsonResponse([], { headers });

      const client = new GenericClient(() => '#/categories?page=2&foo=bar&per_page=12');
      await client.fetchIndex('/categories.json');

      expect(global.fetch).toHaveBeenCalledWith('/categories.json?page=2&per_page=12', { headers: { Accept: 'application/json' } });
    });

    it('does not append query string when hash has no params', async function() {
      const headers = buildResponseHeaders({ page: '1', pages: '1', per_page: '10' });

      stubJsonResponse([], { headers });

      const client = new GenericClient(() => '#/categories');
      await client.fetchIndex('/categories.json');

      expect(global.fetch).toHaveBeenCalledWith('/categories.json', { headers: { Accept: 'application/json' } });
    });

    it('falls back to defaults when pagination headers are absent', async function() {
      const headers = buildResponseHeaders();

      stubJsonResponse([], { headers });

      const client = new GenericClient(() => '');
      const result = await client.fetchIndex('/categories.json');

      expect(result.pagination).toEqual({ page: 1, pages: 1, perPage: 10 });
    });

    it('throws on non-ok response', async function() {
      stubFetchResponse({ ok: false, status: 500 });

      const client = new GenericClient(() => '');

      await expectAsync(client.fetchIndex('/categories.json')).toBeRejectedWithError('Request failed for /categories.json');
    });
  });

  describe('#post', function() {
    it('sends post request with json payload and returns parsed json', async function() {
      stubJsonResponse({ id: 36, name: 'New Item' });

      const client = new GenericClient(() => '');
      const payload = { item: { name: 'New Item' } };
      const result = await client.post('/categories/project/items.json', payload);

      expect(result).toEqual({ id: 36, name: 'New Item' });
      expect(global.fetch).toHaveBeenCalledWith('/categories/project/items.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    });

    it('throws on non-ok response', async function() {
      stubFetchResponse({ ok: false, status: 422 });

      const client = new GenericClient(() => '');

      await expectAsync(
        client.post('/categories/project/items.json', { item: { name: '' } })
      ).toBeRejectedWithError('Request failed for /categories/project/items.json');
    });
  });

  describe('#patch', function() {
    it('sends patch request with json payload and returns parsed json', async function() {
      stubJsonResponse({ id: 35, name: 'Oak Updated' });

      const client = new GenericClient(() => '');
      const payload = { item: { name: 'Oak Updated' } };
      const result = await client.patch('/categories/project/items/35.json', payload);

      expect(result).toEqual({ id: 35, name: 'Oak Updated' });
      expect(global.fetch).toHaveBeenCalledWith('/categories/project/items/35.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    });

    it('throws on non-ok response', async function() {
      stubFetchResponse({ ok: false, status: 422 });

      const client = new GenericClient(() => '');

      await expectAsync(
        client.patch('/categories/project/items/35.json', { item: { name: '' } })
      ).toBeRejectedWithError('Request failed for /categories/project/items/35.json');
    });
  });
});
