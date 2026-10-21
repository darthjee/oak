import AuthorizationsController from '../../../../assets/js/components/pages/controllers/AuthorizationsController.js';
import { isLoggedIn, setLoggedIn } from '../../../../assets/js/utils/authState.js';
import {
  buildAuthorizationsContext,
  buildResponse,
  sampleRequest,
} from '../../../support/authorizationsControllerContext.js';
import { flushPromises } from '../../../support/factories.js';
import { randomCredential } from '../../../support/testCredentials.js';

describe('AuthorizationsController', function() {
  let context;
  let spies;
  let client;
  let controller;
  let modalEvents;
  let lastRows;
  let typedPassword;
  let otherPassword;

  beforeEach(function() {
    typedPassword = randomCredential();
    otherPassword = randomCredential();
    context = buildAuthorizationsContext();
    ({ spies, client, controller, modalEvents, lastRows } = context);
  });

  afterEach(function() {
    context.teardown();
  });

  describe('#buildEffect', function() {
    it('loads the requests on mount', async function() {
      controller.buildEffect()();
      await flushPromises();

      expect(client.mine).toHaveBeenCalled();
      expect(spies.setRequests).toHaveBeenCalledWith([sampleRequest]);
      expect(spies.setLoading).toHaveBeenCalledWith(true);
      expect(spies.setLoading.calls.mostRecent().args[0]).toBe(false);
      expect(spies.setError).not.toHaveBeenCalled();
    });

    it('sets an empty list when no requests are returned', async function() {
      client.mine.and.returnValue(Promise.resolve(buildResponse(200, {})));

      controller.buildEffect()();
      await flushPromises();

      expect(spies.setRequests).toHaveBeenCalledWith([]);
    });

    it('sets a page error with the response message on failure', async function() {
      client.mine.and.returnValue(
        Promise.resolve(buildResponse(500, { message: 'Boom' }))
      );

      controller.buildEffect()();
      await flushPromises();

      expect(spies.setError).toHaveBeenCalledWith('Boom');
      expect(spies.setRequests).not.toHaveBeenCalled();
      expect(spies.setLoading.calls.mostRecent().args[0]).toBe(false);
    });

    it('sets a generic page error when the failure has no message', async function() {
      client.mine.and.returnValue(Promise.resolve(buildResponse(500, {})));

      controller.buildEffect()();
      await flushPromises();

      expect(spies.setError).toHaveBeenCalledWith('Unable to load authorization requests.');
    });

    it('sets a generic page error when the failure body is not JSON', async function() {
      client.mine.and.returnValue(Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('bad json')),
      }));

      controller.buildEffect()();
      await flushPromises();

      expect(spies.setError).toHaveBeenCalledWith('Unable to load authorization requests.');
    });

    it('sets a generic page error on network failure', async function() {
      client.mine.and.returnValue(Promise.reject(new Error('offline')));

      controller.buildEffect()();
      await flushPromises();

      expect(spies.setError).toHaveBeenCalledWith('Unable to load authorization requests.');
      expect(spies.setLoading.calls.mostRecent().args[0]).toBe(false);
    });

    describe('when the session expired', function() {
      beforeEach(async function() {
        setLoggedIn(true);
        client.mine.and.returnValue(
          Promise.resolve(buildResponse(401, { message: 'Unauthorized' }))
        );

        controller.buildEffect()();
        await flushPromises();
      });

      it('logs the user out', function() {
        expect(isLoggedIn()).toBe(false);
      });

      it('opens the login modal in password mode', function() {
        expect(modalEvents).toEqual([{ open: true, mode: 'password' }]);
      });

      it('does not set a page error nor touch the list', function() {
        expect(spies.setError).not.toHaveBeenCalled();
        expect(spies.setRequests).not.toHaveBeenCalled();
      });
    });

    it('does not set state after unmount', async function() {
      const cleanup = controller.buildEffect()();

      spies.setLoading.calls.reset();
      cleanup();
      await flushPromises();

      expect(spies.setRequests).not.toHaveBeenCalled();
      expect(spies.setLoading).not.toHaveBeenCalled();
    });
  });

  describe('#refresh', function() {
    beforeEach(async function() {
      controller.buildEffect()();
      await flushPromises();
      client.mine.calls.reset();
      spies.setRequests.calls.reset();
      spies.setError.calls.reset();
    });

    it('clears the page error and reloads the list', async function() {
      client.mine.and.returnValue(Promise.resolve(buildResponse(200, { requests: [] })));

      await controller.refresh();

      expect(spies.setError).toHaveBeenCalledWith(null);
      expect(client.mine).toHaveBeenCalledTimes(1);
      expect(spies.setRequests).toHaveBeenCalledWith([]);
    });
  });

  describe('row state', function() {
    it('returns an empty state for unknown rows', function() {
      expect(controller.rowState('abc-123')).toEqual({
        formOpen: false, password: '', error: null, submitting: false,
      });
    });

    it('opens the authorize form', function() {
      controller.openAuthorize('abc-123');

      expect(lastRows()['abc-123'].formOpen).toBe(true);
    });

    it('stores the password', function() {
      controller.openAuthorize('abc-123');
      controller.setPassword('abc-123', typedPassword);

      expect(lastRows()['abc-123']).toEqual({
        formOpen: true, password: typedPassword, error: null, submitting: false,
      });
    });

    it('closes the form and discards the password', function() {
      controller.openAuthorize('abc-123');
      controller.setPassword('abc-123', typedPassword);
      controller.closeAuthorize('abc-123');

      expect(lastRows()['abc-123']).toEqual(jasmine.objectContaining({
        formOpen: false, password: '',
      }));
    });

    it('keeps rows independent', function() {
      controller.setPassword('abc-123', typedPassword);
      controller.setPassword('def-456', otherPassword);

      expect(lastRows()['abc-123'].password).toBe(typedPassword);
      expect(lastRows()['def-456'].password).toBe(otherPassword);
    });
  });

  describe('when created without a client', function() {
    it('builds a default AuthorizationRequestsClient', function() {
      const defaultController = new AuthorizationsController(
        spies.setRequests, spies.setLoading, spies.setError, spies.setRows
      );

      expect(typeof defaultController.client.mine).toBe('function');
    });
  });
});
