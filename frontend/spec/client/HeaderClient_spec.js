import HeaderClient from '../../assets/js/client/HeaderClient.js';
import { preserveGlobals, stubFetchResponse } from '../support/factories.js';

describe('HeaderClient', function() {
  let restoreGlobals;

  beforeEach(function() {
    restoreGlobals = preserveGlobals('fetch');
  });

  afterEach(function() {
    restoreGlobals();
  });

  describe('#checkLogin', function() {
    it('sends a GET request to the login status endpoint', async function() {
      stubFetchResponse({ ok: true });

      const client = new HeaderClient();

      await client.checkLogin();

      expect(global.fetch).toHaveBeenCalledWith('/users/login.json', {
        headers: { Accept: 'application/json', 'X-Skip-Cache': '1' },
      });
    });
  });

  describe('#fetchCategories', function() {
    it('sends a GET request to the user categories endpoint', async function() {
      stubFetchResponse({ ok: true, json: () => Promise.resolve([]) });

      const client = new HeaderClient();

      await client.fetchCategories();

      expect(global.fetch).toHaveBeenCalledWith('/user/categories.json', {
        headers: { Accept: 'application/json' },
      });
    });
  });

  describe('#logoff', function() {
    it('sends a DELETE request to the logoff endpoint', async function() {
      stubFetchResponse({ ok: true });

      const client = new HeaderClient();

      await client.logoff();

      expect(global.fetch).toHaveBeenCalledWith('/users/logoff.json', {
        method: 'DELETE',
        headers: { Accept: 'application/json', 'X-Skip-Cache': '1' },
      });
    });
  });
});
