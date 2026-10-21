import LoginModalController from '../../../../assets/js/components/elements/controllers/LoginModalController.js';
import { buildSpies } from '../../../support/factories.js';

describe('LoginModalController', function() {
  let setters;
  let onSuccess;
  let client;
  let requestsClient;
  let poller;
  let controller;

  const SETTER_NAMES = [
    'setLogin', 'setPassword', 'setKeepSignedIn', 'setIncorrect', 'setError',
    'setMode', 'setPanel', 'setSubmitError', 'setNetworkError', 'setExpiresAt',
  ];

  const expectCleared = () => {
    expect(poller.stop).toHaveBeenCalled();
    expect(setters.setLogin).toHaveBeenCalledWith('');
    expect(setters.setPassword).toHaveBeenCalledWith('');
    expect(setters.setKeepSignedIn).toHaveBeenCalledWith(false);
    expect(setters.setIncorrect).toHaveBeenCalledWith(false);
    expect(setters.setError).toHaveBeenCalledWith(false);
    expect(setters.setSubmitError).toHaveBeenCalledWith(null);
    expect(setters.setNetworkError).toHaveBeenCalledWith(false);
    expect(setters.setExpiresAt).toHaveBeenCalledWith(null);
    expect(setters.setPanel).toHaveBeenCalledWith('form');
  };

  beforeEach(function() {
    setters = buildSpies(...SETTER_NAMES);
    onSuccess = jasmine.createSpy('onSuccess');
    client = { submit: jasmine.createSpy('submit') };
    requestsClient = { create: jasmine.createSpy('create'), poll: jasmine.createSpy('poll') };
    poller = jasmine.createSpyObj('poller', ['start', 'stop', 'isRunning']);

    controller = new LoginModalController(setters, {
      onSuccess, client, requestsClient, poller,
    });
  });

  describe('#handleSubmit (password)', function() {
    it('submits login credentials and calls onSuccess on success', async function() {
      client.submit.and.returnValue(Promise.resolve({ ok: true }));

      await controller.handleSubmit('oak-user', 'secret');

      expect(client.submit).toHaveBeenCalledWith('oak-user', 'secret', false);
      expect(setters.setLogin).toHaveBeenCalledWith('');
      expect(setters.setPassword).toHaveBeenCalledWith('');
      expect(setters.setKeepSignedIn).toHaveBeenCalledWith(false);
      expect(setters.setIncorrect).toHaveBeenCalledWith(false);
      expect(setters.setError).toHaveBeenCalledWith(false);
      expect(onSuccess).toHaveBeenCalled();
    });

    it('forwards keepSignedIn to the client', async function() {
      client.submit.and.returnValue(Promise.resolve({ ok: true }));

      await controller.handleSubmit('oak-user', 'secret', true);

      expect(client.submit).toHaveBeenCalledWith('oak-user', 'secret', true);
    });

    it('marks incorrect credentials on client errors', async function() {
      client.submit.and.returnValue(Promise.resolve({ ok: false, status: 404 }));

      await controller.handleSubmit('oak-user', 'wrong-secret', true);

      expect(setters.setPassword).toHaveBeenCalledWith('');
      expect(setters.setIncorrect).toHaveBeenCalledWith(true);
      expect(setters.setError).not.toHaveBeenCalledWith(true);
      expect(setters.setKeepSignedIn).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('marks unexpected errors on server failures', async function() {
      client.submit.and.returnValue(Promise.resolve({ ok: false, status: 500 }));

      await controller.handleSubmit('oak-user', 'secret', true);

      expect(setters.setPassword).toHaveBeenCalledWith('');
      expect(setters.setError).toHaveBeenCalledWith(true);
      expect(setters.setIncorrect).not.toHaveBeenCalledWith(true);
      expect(setters.setKeepSignedIn).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('marks unexpected errors when the client rejects', async function() {
      client.submit.and.returnValue(Promise.reject(new Error('network')));

      await controller.handleSubmit('oak-user', 'secret', true);

      expect(setters.setPassword).toHaveBeenCalledWith('');
      expect(setters.setError).toHaveBeenCalledWith(true);
      expect(setters.setIncorrect).not.toHaveBeenCalledWith(true);
      expect(setters.setKeepSignedIn).not.toHaveBeenCalled();
    });
  });

  describe('#setOnSuccess', function() {
    it('uses the latest callback on success', async function() {
      const latest = jasmine.createSpy('latest');
      client.submit.and.returnValue(Promise.resolve({ ok: true }));

      controller.setOnSuccess(latest);
      await controller.handleSubmit('oak-user', 'secret');

      expect(latest).toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('tolerates a missing callback', async function() {
      client.submit.and.returnValue(Promise.resolve({ ok: true }));

      controller.setOnSuccess(null);

      await expectAsync(controller.handleSubmit('oak-user', 'secret')).toBeResolved();
    });
  });

  describe('#handleClear', function() {
    it('clears fields, errors, panel, countdown and stops the poller', function() {
      controller.handleClear();

      expectCleared();
    });
  });

  describe('#switchMode', function() {
    it('resets everything and sets the device mode', function() {
      controller.switchMode('device');

      expectCleared();
      expect(setters.setMode).toHaveBeenCalledWith('device');
    });

    it('sets the password mode', function() {
      controller.switchMode('password');

      expect(setters.setMode).toHaveBeenCalledWith('password');
    });

    it('falls back to password for unknown modes', function() {
      controller.switchMode('register');

      expect(setters.setMode).toHaveBeenCalledWith('password');
    });
  });

  describe('#tryAgain', function() {
    it('switches to an empty device form', function() {
      controller.tryAgain();

      expectCleared();
      expect(setters.setMode).toHaveBeenCalledWith('device');
    });
  });

  describe('#stop', function() {
    it('stops the poller', function() {
      controller.stop();

      expect(poller.stop).toHaveBeenCalled();
    });
  });
});
