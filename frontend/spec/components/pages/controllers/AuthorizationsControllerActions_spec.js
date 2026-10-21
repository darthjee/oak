import { isLoggedIn, setLoggedIn } from '../../../../assets/js/utils/authState.js';
import {
  buildAuthorizationsContext,
  buildResponse,
  sampleRequest,
} from '../../../support/authorizationsControllerContext.js';
import { randomCredential } from '../../../support/testCredentials.js';

const uuid = 'abc-123';
const rejectionMessage = 'Wrong credentials';

describe('AuthorizationsController actions', function() {
  let context;
  let spies;
  let client;
  let controller;
  let modalEvents;
  let lastRows;
  let typedPassword;

  beforeEach(function() {
    typedPassword = randomCredential();
    context = buildAuthorizationsContext();
    ({ spies, client, controller, modalEvents, lastRows } = context);
  });

  afterEach(function() {
    context.teardown();
  });

  describe('#authorize', function() {
    beforeEach(function() {
      controller.openAuthorize(uuid);
      controller.setPassword(uuid, typedPassword);
      client.mine.calls.reset();
    });

    it('sends the typed password', async function() {
      await controller.authorize(uuid);

      expect(client.authorize).toHaveBeenCalledWith(uuid, typedPassword);
    });

    it('clears the row state and refreshes on success', async function() {
      await controller.authorize(uuid);

      expect(lastRows()[uuid]).toBeUndefined();
      expect(client.mine).toHaveBeenCalledTimes(1);
      expect(spies.setRequests).toHaveBeenCalledWith([sampleRequest]);
    });

    it('marks the row as submitting while the request runs', function() {
      client.authorize.and.returnValue(new Promise(() => {}));

      controller.authorize(uuid);

      expect(lastRows()[uuid].submitting).toBe(true);
    });

    describe('when the response is 400', function() {
      beforeEach(async function() {
        client.authorize.and.returnValue(
          Promise.resolve(buildResponse(400, { message: rejectionMessage }))
        );

        await controller.authorize(uuid);
      });

      it('sets the row error, keeps the form open and clears the password', function() {
        expect(lastRows()[uuid]).toEqual({
          formOpen: true, password: '', error: rejectionMessage, submitting: false,
        });
      });

      it('does not refresh the list', function() {
        expect(client.mine).not.toHaveBeenCalled();
      });
    });

    it('uses a generic row error on 400 without message', async function() {
      client.authorize.and.returnValue(Promise.resolve(buildResponse(400, {})));

      await controller.authorize(uuid);

      expect(lastRows()[uuid].error)
        .toBe('Unable to complete the request. Please try again.');
    });

    describe('when the response is 401', function() {
      beforeEach(async function() {
        setLoggedIn(true);
        client.authorize.and.returnValue(Promise.resolve(buildResponse(401)));

        await controller.authorize(uuid);
      });

      it('logs out and opens the login modal', function() {
        expect(isLoggedIn()).toBe(false);
        expect(modalEvents).toEqual([{ open: true, mode: 'password' }]);
      });

      it('sets no row nor page error and leaves the list untouched', function() {
        expect(lastRows()[uuid].error).toBeNull();
        expect(spies.setError).not.toHaveBeenCalled();
        expect(spies.setRequests).not.toHaveBeenCalled();
        expect(client.mine).not.toHaveBeenCalled();
      });
    });

    it('sets a generic row error on other statuses', async function() {
      client.authorize.and.returnValue(
        Promise.resolve(buildResponse(500, { message: 'Boom' }))
      );

      await controller.authorize(uuid);

      expect(lastRows()[uuid].error)
        .toBe('Unable to complete the request. Please try again.');
    });

    it('sets a generic row error on network failure', async function() {
      client.authorize.and.returnValue(Promise.reject(new Error('offline')));

      await controller.authorize(uuid);

      expect(lastRows()[uuid]).toEqual(jasmine.objectContaining({
        submitting: false,
        error: 'Unable to complete the request. Please try again.',
      }));
    });
  });

  describe('#deny', function() {
    it('denies the request', async function() {
      await controller.deny(uuid);

      expect(client.deny).toHaveBeenCalledWith(uuid);
    });

    it('clears the row state and refreshes on success', async function() {
      controller.setPassword(uuid, typedPassword);

      await controller.deny(uuid);

      expect(lastRows()[uuid]).toBeUndefined();
      expect(client.mine).toHaveBeenCalledTimes(1);
    });

    it('sets the row error on 400', async function() {
      client.deny.and.returnValue(
        Promise.resolve(buildResponse(400, { message: 'Request is not open' }))
      );

      await controller.deny(uuid);

      expect(lastRows()[uuid].error).toBe('Request is not open');
      expect(client.mine).not.toHaveBeenCalled();
    });

    describe('when the response is 401', function() {
      beforeEach(async function() {
        setLoggedIn(true);
        client.deny.and.returnValue(Promise.resolve(buildResponse(401)));

        await controller.deny(uuid);
      });

      it('logs out and opens the login modal', function() {
        expect(isLoggedIn()).toBe(false);
        expect(modalEvents).toEqual([{ open: true, mode: 'password' }]);
      });

      it('sets no row nor page error', function() {
        expect(lastRows()[uuid].error).toBeNull();
        expect(spies.setError).not.toHaveBeenCalled();
        expect(client.mine).not.toHaveBeenCalled();
      });
    });
  });

});
