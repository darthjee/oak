import AuthorizationsController from '../../../../assets/js/components/pages/controllers/AuthorizationsController.js';
import { isLoggedIn, setLoggedIn } from '../../../../assets/js/utils/authState.js';
import LoginModalEvents from '../../../../assets/js/utils/LoginModalEvents.js';
import { buildSpies, flushPromises, preserveGlobals } from '../../../support/factories.js';

const buildResponse = (status, body = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

const sampleRequest = {
  uuid: 'abc-123',
  requestIp: '10.0.0.1',
  requestUserAgent: 'curl/8.0',
  createdAt: '2026-10-21T10:00:00Z',
  expiresAt: '2026-10-21T10:10:00Z',
  keepSignedIn: false,
};

describe('AuthorizationsController', function() {
  let restoreWindow;
  let spies;
  let client;
  let controller;
  let modalEvents;
  let unsubscribeModal;

  const lastRows = () => spies.setRows.calls.mostRecent().args[0];

  beforeEach(function() {
    restoreWindow = preserveGlobals('window');
    global.window = new EventTarget();
    modalEvents = [];
    unsubscribeModal = LoginModalEvents.subscribe((detail) => modalEvents.push(detail));

    spies = buildSpies('setRequests', 'setLoading', 'setError', 'setRows');
    client = {
      mine: jasmine.createSpy('mine').and.returnValue(
        Promise.resolve(buildResponse(200, { requests: [sampleRequest] }))
      ),
      authorize: jasmine.createSpy('authorize').and.returnValue(
        Promise.resolve(buildResponse(200, { authorized: true }))
      ),
      deny: jasmine.createSpy('deny').and.returnValue(
        Promise.resolve(buildResponse(200, { denied: true }))
      ),
    };
    controller = new AuthorizationsController(
      spies.setRequests, spies.setLoading, spies.setError, spies.setRows, client
    );
  });

  afterEach(function() {
    unsubscribeModal();
    restoreWindow();
    setLoggedIn(false);
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
      controller.setPassword('abc-123', 'secret');

      expect(lastRows()['abc-123']).toEqual({
        formOpen: true, password: 'secret', error: null, submitting: false,
      });
    });

    it('closes the form and discards the password', function() {
      controller.openAuthorize('abc-123');
      controller.setPassword('abc-123', 'secret');
      controller.closeAuthorize('abc-123');

      expect(lastRows()['abc-123']).toEqual(jasmine.objectContaining({
        formOpen: false, password: '',
      }));
    });

    it('keeps rows independent', function() {
      controller.setPassword('abc-123', 'one');
      controller.setPassword('def-456', 'two');

      expect(lastRows()['abc-123'].password).toBe('one');
      expect(lastRows()['def-456'].password).toBe('two');
    });
  });

  describe('#authorize', function() {
    beforeEach(function() {
      controller.openAuthorize('abc-123');
      controller.setPassword('abc-123', 'secret');
      client.mine.calls.reset();
    });

    it('sends the typed password', async function() {
      await controller.authorize('abc-123');

      expect(client.authorize).toHaveBeenCalledWith('abc-123', 'secret');
    });

    it('clears the row state and refreshes on success', async function() {
      await controller.authorize('abc-123');

      expect(lastRows()['abc-123']).toBeUndefined();
      expect(client.mine).toHaveBeenCalledTimes(1);
      expect(spies.setRequests).toHaveBeenCalledWith([sampleRequest]);
    });

    it('marks the row as submitting while the request runs', function() {
      client.authorize.and.returnValue(new Promise(() => {}));

      controller.authorize('abc-123');

      expect(lastRows()['abc-123'].submitting).toBe(true);
    });

    describe('when the response is 400', function() {
      beforeEach(async function() {
        client.authorize.and.returnValue(
          Promise.resolve(buildResponse(400, { message: 'Wrong password' }))
        );

        await controller.authorize('abc-123');
      });

      it('sets the row error, keeps the form open and clears the password', function() {
        expect(lastRows()['abc-123']).toEqual({
          formOpen: true, password: '', error: 'Wrong password', submitting: false,
        });
      });

      it('does not refresh the list', function() {
        expect(client.mine).not.toHaveBeenCalled();
      });
    });

    it('uses a generic row error on 400 without message', async function() {
      client.authorize.and.returnValue(Promise.resolve(buildResponse(400, {})));

      await controller.authorize('abc-123');

      expect(lastRows()['abc-123'].error)
        .toBe('Unable to complete the request. Please try again.');
    });

    describe('when the response is 401', function() {
      beforeEach(async function() {
        setLoggedIn(true);
        client.authorize.and.returnValue(Promise.resolve(buildResponse(401)));

        await controller.authorize('abc-123');
      });

      it('logs out and opens the login modal', function() {
        expect(isLoggedIn()).toBe(false);
        expect(modalEvents).toEqual([{ open: true, mode: 'password' }]);
      });

      it('sets no row nor page error and leaves the list untouched', function() {
        expect(lastRows()['abc-123'].error).toBeNull();
        expect(spies.setError).not.toHaveBeenCalled();
        expect(spies.setRequests).not.toHaveBeenCalled();
        expect(client.mine).not.toHaveBeenCalled();
      });
    });

    it('sets a generic row error on other statuses', async function() {
      client.authorize.and.returnValue(
        Promise.resolve(buildResponse(500, { message: 'Boom' }))
      );

      await controller.authorize('abc-123');

      expect(lastRows()['abc-123'].error)
        .toBe('Unable to complete the request. Please try again.');
    });

    it('sets a generic row error on network failure', async function() {
      client.authorize.and.returnValue(Promise.reject(new Error('offline')));

      await controller.authorize('abc-123');

      expect(lastRows()['abc-123']).toEqual(jasmine.objectContaining({
        submitting: false,
        error: 'Unable to complete the request. Please try again.',
      }));
    });
  });

  describe('#deny', function() {
    it('denies the request', async function() {
      await controller.deny('abc-123');

      expect(client.deny).toHaveBeenCalledWith('abc-123');
    });

    it('clears the row state and refreshes on success', async function() {
      controller.setPassword('abc-123', 'x');

      await controller.deny('abc-123');

      expect(lastRows()['abc-123']).toBeUndefined();
      expect(client.mine).toHaveBeenCalledTimes(1);
    });

    it('sets the row error on 400', async function() {
      client.deny.and.returnValue(
        Promise.resolve(buildResponse(400, { message: 'Request is not open' }))
      );

      await controller.deny('abc-123');

      expect(lastRows()['abc-123'].error).toBe('Request is not open');
      expect(client.mine).not.toHaveBeenCalled();
    });

    describe('when the response is 401', function() {
      beforeEach(async function() {
        setLoggedIn(true);
        client.deny.and.returnValue(Promise.resolve(buildResponse(401)));

        await controller.deny('abc-123');
      });

      it('logs out and opens the login modal', function() {
        expect(isLoggedIn()).toBe(false);
        expect(modalEvents).toEqual([{ open: true, mode: 'password' }]);
      });

      it('sets no row nor page error', function() {
        expect(lastRows()['abc-123'].error).toBeNull();
        expect(spies.setError).not.toHaveBeenCalled();
        expect(client.mine).not.toHaveBeenCalled();
      });
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
