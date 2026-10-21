import { isLoggedIn, setLoggedIn } from '../../../../assets/js/utils/authState.js';
import {
  buildAuthorizationsContext,
  buildResponse,
  sampleRequest,
} from '../../../support/authorizationsControllerContext.js';

describe('AuthorizationsController actions', function() {
  let context;
  let spies;
  let client;
  let controller;
  let modalEvents;
  let lastRows;

  beforeEach(function() {
    context = buildAuthorizationsContext();
    ({ spies, client, controller, modalEvents, lastRows } = context);
  });

  afterEach(function() {
    context.teardown();
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

});
