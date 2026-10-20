import LoginModalController from '../../../../assets/js/components/elements/controllers/LoginModalController.js';

describe('LoginModalController', function() {
  let setLogin;
  let setPassword;
  let setKeepSignedIn;
  let setIncorrect;
  let setError;
  let onSuccess;
  let client;
  let controller;

  beforeEach(function() {
    setLogin = jasmine.createSpy('setLogin');
    setPassword = jasmine.createSpy('setPassword');
    setKeepSignedIn = jasmine.createSpy('setKeepSignedIn');
    setIncorrect = jasmine.createSpy('setIncorrect');
    setError = jasmine.createSpy('setError');
    onSuccess = jasmine.createSpy('onSuccess');
    client = {
      submit: jasmine.createSpy('submit'),
    };

    controller = new LoginModalController(
      setLogin,
      setPassword,
      setKeepSignedIn,
      setIncorrect,
      setError,
      onSuccess,
      client
    );
  });

  it('submits login credentials and calls onSuccess on success', async function() {
    client.submit.and.returnValue(Promise.resolve({ ok: true }));

    await controller.handleSubmit('oak-user', 'secret');

    expect(client.submit).toHaveBeenCalledWith('oak-user', 'secret', false);
    expect(setLogin).toHaveBeenCalledWith('');
    expect(setPassword).toHaveBeenCalledWith('');
    expect(setKeepSignedIn).toHaveBeenCalledWith(false);
    expect(setIncorrect).toHaveBeenCalledWith(false);
    expect(setError).toHaveBeenCalledWith(false);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('forwards keepSignedIn to the client', async function() {
    client.submit.and.returnValue(Promise.resolve({ ok: true }));

    await controller.handleSubmit('oak-user', 'secret', true);

    expect(client.submit).toHaveBeenCalledWith('oak-user', 'secret', true);
  });

  it('marks incorrect credentials on client errors', async function() {
    client.submit.and.returnValue(
      Promise.resolve({ ok: false, status: 404 })
    );

    await controller.handleSubmit('oak-user', 'wrong-secret', true);

    expect(setPassword).toHaveBeenCalledWith('');
    expect(setIncorrect).toHaveBeenCalledWith(true);
    expect(setError).not.toHaveBeenCalledWith(true);
    expect(setKeepSignedIn).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('marks unexpected errors on server failures', async function() {
    client.submit.and.returnValue(
      Promise.resolve({ ok: false, status: 500 })
    );

    await controller.handleSubmit('oak-user', 'secret', true);

    expect(setPassword).toHaveBeenCalledWith('');
    expect(setError).toHaveBeenCalledWith(true);
    expect(setIncorrect).not.toHaveBeenCalledWith(true);
    expect(setKeepSignedIn).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('clears the form state', function() {
    controller.handleClear();

    expect(setLogin).toHaveBeenCalledWith('');
    expect(setPassword).toHaveBeenCalledWith('');
    expect(setKeepSignedIn).toHaveBeenCalledWith(false);
    expect(setIncorrect).toHaveBeenCalledWith(false);
    expect(setError).toHaveBeenCalledWith(false);
  });

  it('marks unexpected errors when the client rejects', async function() {
    client.submit.and.returnValue(Promise.reject(new Error('network')));

    await controller.handleSubmit('oak-user', 'secret', true);

    expect(setPassword).toHaveBeenCalledWith('');
    expect(setError).toHaveBeenCalledWith(true);
    expect(setIncorrect).not.toHaveBeenCalledWith(true);
    expect(setKeepSignedIn).not.toHaveBeenCalled();
  });
});
