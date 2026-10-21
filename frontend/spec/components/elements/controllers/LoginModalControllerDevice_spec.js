import LoginModalController, {
  GENERIC_DEVICE_ERROR,
} from '../../../../assets/js/components/elements/controllers/LoginModalController.js';
import AuthorizationRequestPoller from '../../../../assets/js/utils/AuthorizationRequestPoller.js';
import { buildSpies } from '../../../support/factories.js';
import { flushMicrotasks, jsonResponse } from '../../../support/authorizationRequests.js';

describe('LoginModalController device flow', function() {
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

  describe('#handleDeviceSubmit', function() {
    const created = {
      uuid: 'uuid-1', pollToken: 'secret-token', expiresAt: '2026-10-20T16:04:05.000Z',
    };

    it('clears the submit error first', async function() {
      requestsClient.create.and.returnValue(Promise.resolve(jsonResponse(created)));

      await controller.handleDeviceSubmit('oak-user', true);

      expect(setters.setSubmitError.calls.first().args).toEqual([null]);
    });

    it('creates the request with a boolean keepSignedIn', async function() {
      requestsClient.create.and.returnValue(Promise.resolve(jsonResponse(created)));

      await controller.handleDeviceSubmit('oak-user', 'on');

      expect(requestsClient.create).toHaveBeenCalledWith('oak-user', true);
    });

    it('defaults keepSignedIn to false', async function() {
      requestsClient.create.and.returnValue(Promise.resolve(jsonResponse(created)));

      await controller.handleDeviceSubmit('oak-user');

      expect(requestsClient.create).toHaveBeenCalledWith('oak-user', false);
    });

    it('shows waiting and starts the poller on success', async function() {
      requestsClient.create.and.returnValue(Promise.resolve(jsonResponse(created)));

      await controller.handleDeviceSubmit('oak-user', false);

      expect(setters.setExpiresAt).toHaveBeenCalledWith(created.expiresAt);
      expect(setters.setPanel).toHaveBeenCalledWith('waiting');
      expect(poller.start).toHaveBeenCalledWith(created);
    });

    [400, 429].forEach((status) => {
      it(`shows the response message on ${status} and does not poll`, async function() {
        requestsClient.create.and.returnValue(
          Promise.resolve(jsonResponse({ message: `error ${status}` }, status))
        );

        await controller.handleDeviceSubmit('oak-user', false);

        expect(setters.setSubmitError).toHaveBeenCalledWith(`error ${status}`);
        expect(setters.setPanel).not.toHaveBeenCalled();
        expect(poller.start).not.toHaveBeenCalled();
      });
    });

    it('shows a generic message when the error has no message', async function() {
      requestsClient.create.and.returnValue(Promise.resolve(jsonResponse({}, 400)));

      await controller.handleDeviceSubmit('oak-user', false);

      expect(setters.setSubmitError).toHaveBeenCalledWith(GENERIC_DEVICE_ERROR);
    });

    it('shows a generic message when the error body is not JSON', async function() {
      requestsClient.create.and.returnValue(Promise.resolve({
        ok: false, status: 500, json: () => Promise.reject(new Error('bad json')),
      }));

      await controller.handleDeviceSubmit('oak-user', false);

      expect(setters.setSubmitError).toHaveBeenCalledWith(GENERIC_DEVICE_ERROR);
      expect(poller.start).not.toHaveBeenCalled();
    });

    it('shows a generic message on network errors', async function() {
      requestsClient.create.and.returnValue(Promise.reject(new Error('network')));

      await controller.handleDeviceSubmit('oak-user', false);

      expect(setters.setSubmitError).toHaveBeenCalledWith(GENERIC_DEVICE_ERROR);
      expect(setters.setPanel).not.toHaveBeenCalled();
      expect(poller.start).not.toHaveBeenCalled();
    });
  });

  describe('default poller callbacks', function() {
    const startPolling = async (response) => {
      requestsClient.poll.and.returnValue(response);
      controller.poller.start({
        uuid: 'uuid-1', pollToken: 'secret-token', expiresAt: '2026-10-20T16:04:05.000Z',
      });
      jasmine.clock().tick(5000);
      await flushMicrotasks();
    };

    beforeEach(function() {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2026-10-20T16:00:00.000Z'));
      controller = new LoginModalController(setters, { onSuccess, client, requestsClient });
    });

    afterEach(function() {
      controller.stop();
      jasmine.clock().uninstall();
    });

    it('builds a real poller by default', function() {
      expect(controller.poller).toEqual(jasmine.any(AuthorizationRequestPoller));
    });

    it('polls with the requests client', async function() {
      await startPolling(Promise.resolve(jsonResponse({ status: 'open' })));

      expect(requestsClient.poll).toHaveBeenCalledWith('uuid-1', 'secret-token');
    });

    it('clears and calls onSuccess when approved', async function() {
      await startPolling(Promise.resolve(jsonResponse({ status: 'approved' })));

      expect(setters.setPanel).toHaveBeenCalledWith('form');
      expect(setters.setLogin).toHaveBeenCalledWith('');
      expect(setters.setExpiresAt).toHaveBeenCalledWith(null);
      expect(controller.poller.isRunning()).toBeFalse();
      expect(onSuccess).toHaveBeenCalled();
    });

    it('shows the final panel and clears the network error', async function() {
      await startPolling(Promise.resolve(jsonResponse({ status: 'denied' })));

      expect(setters.setNetworkError).toHaveBeenCalledWith(false);
      expect(setters.setPanel).toHaveBeenCalledWith('denied');
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('flags network errors', async function() {
      await startPolling(Promise.reject(new Error('network')));

      expect(setters.setNetworkError).toHaveBeenCalledWith(true);
    });
  });
});
