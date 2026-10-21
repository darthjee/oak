import AuthorizationsController from '../../assets/js/components/pages/controllers/AuthorizationsController.js';
import { setLoggedIn } from '../../assets/js/utils/authState.js';
import LoginModalEvents from '../../assets/js/utils/LoginModalEvents.js';
import { buildSpies, preserveGlobals } from './factories.js';

/**
 * Builds a fake fetch `Response` with the given status and JSON body.
 *
 * @param {number} status HTTP status code
 * @param {object} [body={}] JSON body returned by `json()`
 * @returns {{ok: boolean, status: number, json: Function}} fake response
 */
export const buildResponse = (status, body = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

/**
 * Sample open authorization request as returned by the `mine` endpoint.
 *
 * @type {object}
 */
export const sampleRequest = Object.freeze({
  uuid: 'abc-123',
  requestIp: '10.0.0.1',
  requestUserAgent: 'curl/8.0',
  createdAt: '2026-10-21T10:00:00Z',
  expiresAt: '2026-10-21T10:10:00Z',
  keepSignedIn: false,
});

/**
 * Builds an AuthorizationsController with spy setters, a stubbed client and a fake
 * `window` capturing login modal events.
 *
 * @returns {{spies: object, client: object, controller: AuthorizationsController,
 *   modalEvents: Array<object>, lastRows: Function, teardown: Function}} test context
 */
export const buildAuthorizationsContext = () => {
  const restoreWindow = preserveGlobals('window');

  global.window = new EventTarget();

  const modalEvents = [];
  const unsubscribeModal = LoginModalEvents.subscribe((detail) => modalEvents.push(detail));
  const spies = buildSpies('setRequests', 'setLoading', 'setError', 'setRows');
  const client = {
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
  const controller = new AuthorizationsController(
    spies.setRequests, spies.setLoading, spies.setError, spies.setRows, client
  );

  return {
    spies,
    client,
    controller,
    modalEvents,
    lastRows: () => spies.setRows.calls.mostRecent().args[0],
    teardown: () => {
      unsubscribeModal();
      restoreWindow();
      setLoggedIn(false);
    },
  };
};
