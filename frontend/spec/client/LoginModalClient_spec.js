import LoginModalClient from '../../assets/js/client/LoginModalClient.js';
import { preserveGlobals, stubFetchResponse } from '../support/factories.js';

describe('LoginModalClient', function() {
  let restoreGlobals;

  beforeEach(function() {
    restoreGlobals = preserveGlobals('fetch');
  });

  afterEach(function() {
    restoreGlobals();
  });

  it('submits the login payload to the json endpoint', async function() {
    stubFetchResponse({ ok: true });

    const client = new LoginModalClient();

    await client.submit('oak-user', 'secret');

    expect(global.fetch).toHaveBeenCalledWith('/users/login.json', {
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
        },
      }),
    });
  });
});
