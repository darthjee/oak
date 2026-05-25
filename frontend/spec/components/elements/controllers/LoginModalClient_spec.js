import LoginModalClient from '../../../../assets/js/components/elements/controllers/LoginModalClient.js';

describe('LoginModalClient', function() {
  let originalFetch;

  beforeEach(function() {
    originalFetch = global.fetch;
  });

  afterEach(function() {
    global.fetch = originalFetch;
  });

  it('submits the login payload to the json endpoint', async function() {
    global.fetch = jasmine.createSpy('fetch').and.returnValue(Promise.resolve({ ok: true }));

    const client = new LoginModalClient();

    await client.submit('oak-user', 'secret');

    expect(global.fetch).toHaveBeenCalledWith('/users/login.json', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
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
