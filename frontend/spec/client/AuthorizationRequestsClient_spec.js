import AuthorizationRequestsClient from '../../assets/js/client/AuthorizationRequestsClient.js';
import { preserveGlobals, stubFetchResponse } from '../support/factories.js';

describe('AuthorizationRequestsClient', function() {
  let restoreGlobals;
  let client;

  const expectedRequest = (body) => ({
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Skip-Cache': '1',
    },
    body: JSON.stringify(body),
  });

  beforeEach(function() {
    restoreGlobals = preserveGlobals('fetch');
    stubFetchResponse({ ok: true });
    client = new AuthorizationRequestsClient();
  });

  afterEach(function() {
    restoreGlobals();
  });

  describe('#create', function() {
    it('posts the login with keepSignedIn false by default', async function() {
      await client.create('oak-user');

      expect(global.fetch).toHaveBeenCalledWith(
        '/auth/authorization-requests.json',
        expectedRequest({ login: 'oak-user', keepSignedIn: false })
      );
    });

    it('sends keepSignedIn true when requested', async function() {
      await client.create('oak-user', true);

      expect(global.fetch).toHaveBeenCalledWith(
        '/auth/authorization-requests.json',
        expectedRequest({ login: 'oak-user', keepSignedIn: true })
      );
    });

    it('coerces truthy keepSignedIn values to a boolean', async function() {
      await client.create('oak-user', 'on');

      expect(global.fetch).toHaveBeenCalledWith(
        '/auth/authorization-requests.json',
        expectedRequest({ login: 'oak-user', keepSignedIn: true })
      );
    });

    it('coerces falsy keepSignedIn values to false', async function() {
      await client.create('oak-user', null);

      expect(global.fetch).toHaveBeenCalledWith(
        '/auth/authorization-requests.json',
        expectedRequest({ login: 'oak-user', keepSignedIn: false })
      );
    });

    it('returns the fetch response', async function() {
      const response = await client.create('oak-user');

      expect(response).toEqual({ ok: true });
    });
  });

  describe('#poll', function() {
    it('posts the poll token to the request poll endpoint', async function() {
      await client.poll('abc-123', 'secret-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/auth/authorization-requests/abc-123/poll.json',
        expectedRequest({ pollToken: 'secret-token' })
      );
    });

    it('encodes the uuid in the path', async function() {
      await client.poll('a/b c', 'secret-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/auth/authorization-requests/a%2Fb%20c/poll.json',
        expectedRequest({ pollToken: 'secret-token' })
      );
    });

    it('returns the fetch response', async function() {
      const response = await client.poll('abc-123', 'secret-token');

      expect(response).toEqual({ ok: true });
    });
  });
  describe('#mine', function() {
    it('posts an empty body to the mine endpoint', async function() {
      await client.mine();

      expect(global.fetch).toHaveBeenCalledWith(
        '/auth/authorization-requests/mine.json',
        expectedRequest({})
      );
    });

    it('returns the fetch response', async function() {
      const response = await client.mine();

      expect(response).toEqual({ ok: true });
    });
  });

  describe('#authorize', function() {
    it('posts the password to the authorize endpoint', async function() {
      await client.authorize('abc-123', 'secret');

      expect(global.fetch).toHaveBeenCalledWith(
        '/auth/authorization-requests/abc-123/authorize.json',
        expectedRequest({ password: 'secret' })
      );
    });

    it('encodes the uuid in the path', async function() {
      await client.authorize('a/b c', 'secret');

      expect(global.fetch).toHaveBeenCalledWith(
        '/auth/authorization-requests/a%2Fb%20c/authorize.json',
        expectedRequest({ password: 'secret' })
      );
    });

    it('returns the fetch response', async function() {
      const response = await client.authorize('abc-123', 'secret');

      expect(response).toEqual({ ok: true });
    });
  });

  describe('#deny', function() {
    it('posts an empty body to the deny endpoint', async function() {
      await client.deny('abc-123');

      expect(global.fetch).toHaveBeenCalledWith(
        '/auth/authorization-requests/abc-123/deny.json',
        expectedRequest({})
      );
    });

    it('encodes the uuid in the path', async function() {
      await client.deny('a/b c');

      expect(global.fetch).toHaveBeenCalledWith(
        '/auth/authorization-requests/a%2Fb%20c/deny.json',
        expectedRequest({})
      );
    });

    it('returns the fetch response', async function() {
      const response = await client.deny('abc-123');

      expect(response).toEqual({ ok: true });
    });
  });
});
