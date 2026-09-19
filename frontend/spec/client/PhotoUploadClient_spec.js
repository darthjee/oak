import PhotoUploadClient from '../../assets/js/client/PhotoUploadClient.js';
import { setLoggedIn } from '../../assets/js/utils/authState.js';
import { preserveGlobals, stubFetchResponse } from '../support/factories.js';

describe('PhotoUploadClient', function() {
  let restoreGlobals;

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
    setLoggedIn(false);
  });

  describe('#init', function() {
    it('sends a post request with the file name and returns the created photo', async function() {
      stubJsonResponse({ id: 7, file_name: 'photo.png', ready: false });

      const client = new PhotoUploadClient();
      const result = await client.init('project', 35, 'photo.png');

      expect(result).toEqual({ id: 7, file_name: 'photo.png', ready: false });
      expect(global.fetch).toHaveBeenCalledWith('/categories/project/items/35/photos.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photo: { file_name: 'photo.png' } }),
      });
    });

    it('includes X-Skip-Cache when the user is logged in', async function() {
      stubJsonResponse({ id: 7, file_name: 'photo.png', ready: false });
      setLoggedIn(true);

      const client = new PhotoUploadClient();
      await client.init('project', 35, 'photo.png');

      expect(global.fetch).toHaveBeenCalledWith('/categories/project/items/35/photos.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': '1',
        },
        body: JSON.stringify({ photo: { file_name: 'photo.png' } }),
      });
    });

    it('throws on non-ok response', async function() {
      stubFetchResponse({ ok: false, status: 422 });

      const client = new PhotoUploadClient();

      await expectAsync(client.init('project', 35, 'photo.png')).toBeRejectedWithError(
        'Request failed for /categories/project/items/35/photos.json'
      );
    });
  });

  describe('#submit', function() {
    it('sends a multipart/form-data request with the file', async function() {
      stubFetchResponse({ ok: true });

      const client = new PhotoUploadClient();
      const file = new File(['data'], 'photo.png', { type: 'image/png' });

      await client.submit('project', 35, 7, file);

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const [path, options] = global.fetch.calls.mostRecent().args;

      expect(path).toBe('/uploads/categories/project/items/35/photos/7/submit');
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({ Accept: 'application/json' });
      expect(options.body instanceof FormData).toBe(true);
      expect(options.body.get('file')).toBe(file);
    });

    it('includes X-Skip-Cache when the user is logged in', async function() {
      stubFetchResponse({ ok: true });
      setLoggedIn(true);

      const client = new PhotoUploadClient();
      const file = new Blob(['data'], { type: 'image/png' });

      await client.submit('project', 35, 7, file);

      const [, options] = global.fetch.calls.mostRecent().args;

      expect(options.headers).toEqual({ Accept: 'application/json', 'X-Skip-Cache': '1' });
    });

    it('throws on non-ok response', async function() {
      stubFetchResponse({ ok: false, status: 422 });

      const client = new PhotoUploadClient();
      const file = new Blob(['data'], { type: 'image/png' });

      await expectAsync(client.submit('project', 35, 7, file)).toBeRejectedWithError(
        'Request failed for /uploads/categories/project/items/35/photos/7/submit'
      );
    });
  });

  describe('#delete', function() {
    it('sends a delete request to the photo path', async function() {
      stubFetchResponse({ ok: true });

      const client = new PhotoUploadClient();
      await client.delete('project', 35, 7);

      expect(global.fetch).toHaveBeenCalledWith('/uploads/categories/project/items/35/photos/7', {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      });
    });

    it('includes X-Skip-Cache when the user is logged in', async function() {
      stubFetchResponse({ ok: true });
      setLoggedIn(true);

      const client = new PhotoUploadClient();
      await client.delete('project', 35, 7);

      expect(global.fetch).toHaveBeenCalledWith('/uploads/categories/project/items/35/photos/7', {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': '1',
        },
      });
    });

    it('throws on non-ok response', async function() {
      stubFetchResponse({ ok: false, status: 422 });

      const client = new PhotoUploadClient();

      await expectAsync(client.delete('project', 35, 7)).toBeRejectedWithError(
        'Request failed for /uploads/categories/project/items/35/photos/7'
      );
    });
  });

  describe('#upload', function() {
    it('sequences init then submit, exactly once each, and returns the created photo', async function() {
      const file = new Blob(['data'], { type: 'image/png' });

      global.fetch = jasmine.createSpy('fetch').and.callFake((path) => {
        if (path === '/categories/project/items/35/photos.json') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 7, file_name: 'photo.png', ready: false }),
          });
        }

        if (path === '/uploads/categories/project/items/35/photos/7/submit') {
          return Promise.resolve({ ok: true });
        }

        return Promise.reject(new Error(`Unexpected URL: ${path}`));
      });

      const client = new PhotoUploadClient();
      const result = await client.upload('project', 35, file);

      expect(result).toEqual({ id: 7, file_name: 'photo.png', ready: false });
      expect(global.fetch).toHaveBeenCalledTimes(2);

      const calledUrls = global.fetch.calls.allArgs().map(([url]) => url);

      expect(calledUrls).toEqual([
        '/categories/project/items/35/photos.json',
        '/uploads/categories/project/items/35/photos/7/submit',
      ]);
    });

    it('propagates a rejection from init without calling submit', async function() {
      const file = new Blob(['data'], { type: 'image/png' });

      stubFetchResponse({ ok: false, status: 422 });

      const client = new PhotoUploadClient();

      await expectAsync(client.upload('project', 35, file)).toBeRejected();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('propagates a rejection from submit', async function() {
      const file = new Blob(['data'], { type: 'image/png' });

      global.fetch = jasmine.createSpy('fetch').and.callFake((path) => {
        if (path === '/categories/project/items/35/photos.json') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 7, file_name: 'photo.png', ready: false }),
          });
        }

        return Promise.resolve({ ok: false, status: 422 });
      });

      const client = new PhotoUploadClient();

      await expectAsync(client.upload('project', 35, file)).toBeRejected();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
