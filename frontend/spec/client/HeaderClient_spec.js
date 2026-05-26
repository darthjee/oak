import HeaderClient from '../../assets/js/client/HeaderClient.js';

describe('HeaderClient', function() {
  let originalFetch;

  beforeEach(function() {
    originalFetch = global.fetch;
  });

  afterEach(function() {
    global.fetch = originalFetch;
  });

  describe('#checkLogin', function() {
    it('sends a GET request to the login status endpoint', async function() {
      global.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({ ok: true })
      );

      const client = new HeaderClient();

      await client.checkLogin();

      expect(global.fetch).toHaveBeenCalledWith('/users/login.json', {
        headers: { Accept: 'application/json' },
      });
    });
  });

  describe('#fetchCategories', function() {
    it('sends a GET request to the user categories endpoint', async function() {
      global.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      );

      const client = new HeaderClient();

      await client.fetchCategories();

      expect(global.fetch).toHaveBeenCalledWith('/user/categories.json', {
        headers: { Accept: 'application/json' },
      });
    });
  });

  describe('#logoff', function() {
    it('sends a DELETE request to the logoff endpoint', async function() {
      global.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({ ok: true })
      );

      const client = new HeaderClient();

      await client.logoff();

      expect(global.fetch).toHaveBeenCalledWith('/users/logoff.json', {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
    });
  });
});
