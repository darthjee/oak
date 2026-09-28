import PhotoMigrationClient from '../../assets/js/client/PhotoMigrationClient.js';
import { setLoggedIn } from '../../assets/js/utils/authState.js';
import { preserveGlobals, stubFetchResponse } from '../support/factories.js';

describe('PhotoMigrationClient', function() {
  let restoreGlobals;

  const body = { migrated: 3, missing: [18], failed: [{ id: 19, reason: 'rename failed' }], remaining: 9 };

  const stubJsonResponse = (data) => stubFetchResponse({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  });

  beforeEach(function() {
    restoreGlobals = preserveGlobals('fetch');
  });

  afterEach(function() {
    restoreGlobals();
    setLoggedIn(false);
  });

  describe('#migrate', function() {
    it('sends a post request with the limit', async function() {
      stubJsonResponse(body);

      await new PhotoMigrationClient().migrate(20);

      expect(global.fetch).toHaveBeenCalledWith('/migrations/photos?limit=20', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
    });

    it('includes X-Skip-Cache when the user is logged in', async function() {
      stubJsonResponse(body);
      setLoggedIn(true);

      await new PhotoMigrationClient().migrate(5);

      expect(global.fetch).toHaveBeenCalledWith('/migrations/photos?limit=5', {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-Skip-Cache': '1' },
        credentials: 'same-origin',
      });
    });

    it('resolves with the parsed body on success', async function() {
      stubJsonResponse(body);

      const result = await new PhotoMigrationClient().migrate(20);

      expect(result).toEqual(body);
    });

    [401, 403, 502].forEach((status) => {
      it(`throws an error carrying the status on ${status}`, async function() {
        stubFetchResponse({ ok: false, status });

        let error;

        try {
          await new PhotoMigrationClient().migrate(20);
        } catch (e) {
          error = e;
        }

        expect(error).toEqual(jasmine.any(Error));
        expect(error.message).toEqual('Request failed for /migrations/photos?limit=20');
        expect(error.status).toEqual(status);
      });
    });
  });
});
