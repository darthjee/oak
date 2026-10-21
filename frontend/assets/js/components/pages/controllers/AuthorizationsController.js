import AuthorizationRequestsClient from '../../../client/AuthorizationRequestsClient.js';
import BasePageController from './BasePageController.js';
import { setLoggedIn } from '../../../utils/authState.js';
import LoginModalEvents, { MODE_PASSWORD } from '../../../utils/LoginModalEvents.js';

const LOAD_ERROR = 'Unable to load authorization requests.';
const ACTION_ERROR = 'Unable to complete the request. Please try again.';

const EMPTY_ROW = Object.freeze({
  formOpen: false,
  password: '',
  error: null,
  submitting: false,
});

/**
 * Manages the Authorizations page: loads the user's open device authorization requests
 * and handles per-row authorize/deny actions.
 */
export default class AuthorizationsController extends BasePageController {
  /**
   * Creates a new AuthorizationsController instance.
   *
   * @param {Function} setRequests state setter for the list of open requests
   * @param {Function} setLoading state setter for the loading flag
   * @param {Function} setError state setter for the page-level error message
   * @param {Function} setRows state setter for the per-uuid row state map
   * @param {AuthorizationRequestsClient|null} [client] optional client instance
   *   (defaults to new AuthorizationRequestsClient)
   */
  constructor(setRequests, setLoading, setError, setRows, client = null) {
    super();
    this.setRequests = setRequests;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setRows = setRows;
    this.client = client ?? new AuthorizationRequestsClient();
    this.rows = {};
    this.safeSet = this.buildSafeSetter(() => true);
  }

  /**
   * Builds the React effect that loads the request list on mount.
   *
   * @returns {Function} effect function that starts loading and returns a cleanup function
   */
  buildEffect() {
    return () => {
      let mounted = true;

      this.safeSet = this.buildSafeSetter(() => mounted);
      this.#load();

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Reloads the request list, clearing any page-level error first.
   *
   * @returns {Promise<void>} resolves once the reload finishes
   */
  refresh() {
    this.safeSet(this.setError, null);

    return this.#load();
  }

  /**
   * Returns the current state of a row, falling back to the default empty state.
   *
   * @param {string} uuid authorization request identifier
   * @returns {{formOpen: boolean, password: string, error: (string|null), submitting: boolean}}
   *   row state
   */
  rowState(uuid) {
    return this.rows[uuid] ?? EMPTY_ROW;
  }

  /**
   * Opens the inline authorize form for a row.
   *
   * @param {string} uuid authorization request identifier
   * @returns {void}
   */
  openAuthorize(uuid) {
    this.#updateRow(uuid, { formOpen: true, error: null });
  }

  /**
   * Closes the inline authorize form for a row, discarding the typed password.
   *
   * @param {string} uuid authorization request identifier
   * @returns {void}
   */
  closeAuthorize(uuid) {
    this.#updateRow(uuid, { formOpen: false, password: '' });
  }

  /**
   * Updates the password typed in a row's inline form.
   *
   * @param {string} uuid authorization request identifier
   * @param {string} value password value
   * @returns {void}
   */
  setPassword(uuid, value) {
    this.#updateRow(uuid, { password: value });
  }

  /**
   * Authorizes a request with the password typed in its row.
   *
   * @param {string} uuid authorization request identifier
   * @returns {Promise<void>} resolves once the action is handled
   */
  authorize(uuid) {
    const { password } = this.rowState(uuid);

    return this.#runAction(
      uuid,
      () => this.client.authorize(uuid, password),
      { formOpen: true, password: '' }
    );
  }

  /**
   * Denies a request.
   *
   * @param {string} uuid authorization request identifier
   * @returns {Promise<void>} resolves once the action is handled
   */
  deny(uuid) {
    return this.#runAction(uuid, () => this.client.deny(uuid), {});
  }

  async #load() {
    this.safeSet(this.setLoading, true);

    try {
      const response = await this.client.mine();

      if (response.status === 401) {
        this.#handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const message = await this.#readMessage(response);

        this.safeSet(this.setError, message || LOAD_ERROR);
        return;
      }

      const body = await response.json();
      const requests = Array.isArray(body?.requests) ? body.requests : [];

      this.safeSet(this.setRequests, requests);
    } catch {
      this.safeSet(this.setError, LOAD_ERROR);
    } finally {
      this.safeSet(this.setLoading, false);
    }
  }

  async #runAction(uuid, call, badRequestChanges) {
    this.#updateRow(uuid, { submitting: true, error: null });

    try {
      const response = await call();

      if (response.ok) {
        this.#clearRow(uuid);
        await this.refresh();
        return;
      }

      if (response.status === 401) {
        this.#updateRow(uuid, { submitting: false });
        this.#handleUnauthorized();
        return;
      }

      if (response.status === 400) {
        const message = await this.#readMessage(response);

        this.#updateRow(uuid, {
          ...badRequestChanges,
          submitting: false,
          error: message || ACTION_ERROR,
        });
        return;
      }

      this.#updateRow(uuid, { submitting: false, error: ACTION_ERROR });
    } catch {
      this.#updateRow(uuid, { submitting: false, error: ACTION_ERROR });
    }
  }

  #handleUnauthorized() {
    setLoggedIn(false);
    LoginModalEvents.open(MODE_PASSWORD);
  }

  async #readMessage(response) {
    try {
      const body = await response.json();

      return typeof body?.message === 'string' ? body.message : null;
    } catch {
      return null;
    }
  }

  #updateRow(uuid, changes) {
    this.rows = {
      ...this.rows,
      [uuid]: { ...this.rowState(uuid), ...changes },
    };
    this.safeSet(this.setRows, this.rows);
  }

  #clearRow(uuid) {
    const rest = { ...this.rows };

    delete rest[uuid];
    this.rows = rest;
    this.safeSet(this.setRows, this.rows);
  }
}
