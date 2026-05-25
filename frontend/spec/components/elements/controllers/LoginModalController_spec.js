import LoginModalController from '../../../../assets/js/components/elements/controllers/LoginModalController.js';

describe('LoginModalController', function() {
  let setLogin;
  let setPassword;
  let setIncorrect;
  let setError;
  let onSuccess;
  let client;

  beforeEach(function() {
    setLogin = jasmine.createSpy('setLogin');
    setPassword = jasmine.createSpy('setPassword');
    setIncorrect = jasmine.createSpy('setIncorrect');
    setError = jasmine.createSpy('setError');
    onSuccess = jasmine.createSpy('onSuccess');
    client = {
      submit: jasmine.createSpy('submit'),
    };
  });

  it('submits login credentials and calls onSuccess on success', async function() {
    client.submit.and.returnValue(Promise.resolve({ ok: true }));

    const controller = new LoginModalController(
      setLogin,
      setPassword,
      setIncorrect,
      setError,
      onSuccess,
      client
    );

    await controller.handleSubmit('oak-user', 'secret');

    expect(client.submit).toHaveBeenCalledWith('oak-user', 'secret');
    expect(setLogin).toHaveBeenCalledWith('');
    expect(setPassword).toHaveBeenCalledWith('');
    expect(setIncorrect).toHaveBeenCalledWith(false);
    expect(setError).toHaveBeenCalledWith(false);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('marks incorrect credentials on client errors', async function() {
    client.submit.and.returnValue(
      Promise.resolve({ ok: false, status: 404 })
    );

    const controller = new LoginModalController(
      setLogin,
      setPassword,
      setIncorrect,
      setError,
      onSuccess,
      client
    );

    await controller.handleSubmit('oak-user', 'wrong-secret');

    expect(setPassword).toHaveBeenCalledWith('');
    expect(setIncorrect).toHaveBeenCalledWith(true);
    expect(setError).not.toHaveBeenCalledWith(true);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('marks unexpected errors on server failures', async function() {
    client.submit.and.returnValue(
      Promise.resolve({ ok: false, status: 500 })
    );

    const controller = new LoginModalController(
      setLogin,
      setPassword,
      setIncorrect,
      setError,
      onSuccess,
      client
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
      onSuccess,
      client
    );

    controller.handleClear();

    expect(setLogin).toHaveBeenCalledWith('');
    expect(setPassword).toHaveBeenCalledWith('');
    expect(setIncorrect).toHaveBeenCalledWith(false);
    expect(setError).toHaveBeenCalledWith(false);
  });

  it('marks unexpected errors when the client rejects', async function() {
    client.submit.and.returnValue(Promise.reject(new Error('network')));

    const controller = new LoginModalController(
      setLogin,
      setPassword,
      setIncorrect,
      setError,
      onSuccess,
      client
    );

    await controller.handleSubmit('oak-user', 'secret');

    expect(setPassword).toHaveBeenCalledWith('');
    expect(setError).toHaveBeenCalledWith(true);
    expect(setIncorrect).not.toHaveBeenCalledWith(true);
  });
});
