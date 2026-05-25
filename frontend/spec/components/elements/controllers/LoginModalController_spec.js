import LoginModalController from '../../../../assets/js/components/elements/controllers/LoginModalController.js';

describe('LoginModalController', function() {
  let originalFetch;
  let setLogin;
  let setPassword;
  let setIncorrect;
  let setError;
  let onSuccess;

  beforeEach(function() {
    originalFetch = global.fetch;
    setLogin = jasmine.createSpy('setLogin');
    setPassword = jasmine.createSpy('setPassword');
    setIncorrect = jasmine.createSpy('setIncorrect');
    setError = jasmine.createSpy('setError');
    onSuccess = jasmine.createSpy('onSuccess');
  });

  afterEach(function() {
    global.fetch = originalFetch;
  });

  it('submits login credentials and calls onSuccess on success', async function() {
    global.fetch = jasmine.createSpy('fetch').and.returnValue(Promise.resolve({ ok: true }));

    const controller = new LoginModalController(
      setLogin,
      setPassword,
      setIncorrect,
      setError,
      onSuccess
    );

    await controller.handleSubmit('oak-user', 'secret');

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
    expect(setLogin).toHaveBeenCalledWith('');
    expect(setPassword).toHaveBeenCalledWith('');
    expect(setIncorrect).toHaveBeenCalledWith(false);
    expect(setError).toHaveBeenCalledWith(false);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('marks incorrect credentials on client errors', async function() {
    global.fetch = jasmine.createSpy('fetch').and.returnValue(
      Promise.resolve({ ok: false, status: 404 })
    );

    const controller = new LoginModalController(
      setLogin,
      setPassword,
      setIncorrect,
      setError,
      onSuccess
    );

    await controller.handleSubmit('oak-user', 'wrong-secret');

    expect(setPassword).toHaveBeenCalledWith('');
    expect(setIncorrect).toHaveBeenCalledWith(true);
    expect(setError).not.toHaveBeenCalledWith(true);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('marks unexpected errors on server failures', async function() {
    global.fetch = jasmine.createSpy('fetch').and.returnValue(
      Promise.resolve({ ok: false, status: 500 })
    );

    const controller = new LoginModalController(
      setLogin,
      setPassword,
      setIncorrect,
      setError,
      onSuccess
    );

    await controller.handleSubmit('oak-user', 'secret');

    expect(setPassword).toHaveBeenCalledWith('');
    expect(setError).toHaveBeenCalledWith(true);
    expect(setIncorrect).not.toHaveBeenCalledWith(true);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('clears the form state', function() {
    const controller = new LoginModalController(
      setLogin,
      setPassword,
      setIncorrect,
      setError,
      onSuccess
    );

    controller.handleClear();

    expect(setLogin).toHaveBeenCalledWith('');
    expect(setPassword).toHaveBeenCalledWith('');
    expect(setIncorrect).toHaveBeenCalledWith(false);
    expect(setError).toHaveBeenCalledWith(false);
  });
});
