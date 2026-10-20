import LoginModalClient from '../../assets/js/client/LoginModalClient.js';
import { preserveGlobals, stubFetchResponse } from '../support/factories.js';

describe('LoginModalClient', function() {
  let restoreGlobals;

  const expectedRequest = (keepSignedIn) => ({
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Skip-Cache': '1',
    },
    body: JSON.stringify({
      login: {
        login: 'oak-user',
        password: 'secret',
        keepSignedIn,
      },
    }),
  });

  beforeEach(function() {
    restoreGlobals = preserveGlobals('fetch');
    stubFetchResponse({ ok: true });
  });

  afterEach(function() {
    restoreGlobals();
  });

  it('submits the login payload to the json endpoint', async function() {
    const client = new LoginModalClient();

    await client.submit('oak-user', 'secret');

    expect(global.fetch).toHaveBeenCalledWith('/users/login.json', expectedRequest(false));
  });

  it('sends keepSignedIn true when requested', async function() {
    const client = new LoginModalClient();

    await client.submit('oak-user', 'secret', true);

    expect(global.fetch).toHaveBeenCalledWith('/users/login.json', expectedRequest(true));
  });

  it('sends keepSignedIn false when a falsy value is passed', async function() {
    const client = new LoginModalClient();

    await client.submit('oak-user', 'secret', undefined);

    expect(global.fetch).toHaveBeenCalledWith('/users/login.json', expectedRequest(false));
  });
});
