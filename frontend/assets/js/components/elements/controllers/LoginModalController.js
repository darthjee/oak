import LoginModalClient from '../../../client/LoginModalClient.js';
import AuthorizationRequestsClient from '../../../client/AuthorizationRequestsClient.js';
import AuthorizationRequestPoller from '../../../utils/AuthorizationRequestPoller.js';
import { LOGIN_MODAL_MODES, MODE_DEVICE, MODE_PASSWORD } from '../../../utils/LoginModalEvents.js';

/**
 * Generic message shown when a device authorization request cannot be created.
 *
 * @type {string}
 */
export const GENERIC_DEVICE_ERROR = 'Could not request authorization. Please try again.';

const noop = () => {};

/**
 * Manages login modal state, password logins and device authorization requests.
 *
 * Designed to be created once per modal instance so the poller survives re-renders.
 */
export default class LoginModalController {
  /**
   * Creates a new LoginModalController instance.
   *
   * @param {object} setters state setters
   * @param {Function} setters.setLogin state setter for the login field
   * @param {Function} setters.setPassword state setter for the password field
   * @param {Function} setters.setKeepSignedIn state setter for the keep me signed in checkbox
   * @param {Function} setters.setIncorrect state setter for invalid credential errors
   * @param {Function} setters.setError state setter for unexpected errors
   * @param {Function} [setters.setMode] state setter for the modal mode
   * @param {Function} [setters.setPanel] state setter for the device panel
   * @param {Function} [setters.setSubmitError] state setter for the device submit error message
   * @param {Function} [setters.setNetworkError] state setter for the polling network error flag
   * @param {Function} [setters.setExpiresAt] state setter for the countdown target
   * @param {object} [options] collaborators
   * @param {Function|null} [options.onSuccess] callback invoked after a successful login
   * @param {LoginModalClient} [options.client] HTTP client used for password logins
   * @param {AuthorizationRequestsClient} [options.requestsClient] HTTP client used for
   *   authorization requests
   * @param {AuthorizationRequestPoller} [options.poller] poller for authorization requests
   */
  constructor(setters, options = {}) {
    this.#assignSetters(setters);
    this.#assignCollaborators(options);
  }

  /**
   * Updates the success callback (the component passes the latest one on every render).
   *
   * @param {Function|null} onSuccess callback invoked after a successful login
   * @returns {void}
   */
  setOnSuccess(onSuccess) {
    this.onSuccess = onSuccess;
  }

  /**
   * Submits the password login request using the provided credentials.
   *
   * @param {string} login login name to submit
   * @param {string} password password to submit
   * @param {boolean} [keepSignedIn=false] whether the session should persist
   * @returns {Promise<void>} resolves when the request handling finishes
   */
  async handleSubmit(login, password, keepSignedIn = false) {
    this.setIncorrect(false);
    this.setError(false);

    try {
      const response = await this.client.submit(login, password, keepSignedIn);

      this.#handleResponse(response);
    } catch {
      this.#handleUnexpectedError();
    }
  }

  /**
   * Creates a device authorization request and starts polling it.
   *
   * @param {string} login login name requesting authorization
   * @param {boolean} [keepSignedIn=false] whether the session should persist
   * @returns {Promise<void>} resolves when the request handling finishes
   */
  async handleDeviceSubmit(login, keepSignedIn = false) {
    this.setSubmitError(null);

    try {
      const response = await this.requestsClient.create(login, Boolean(keepSignedIn));

      if (!response.ok) {
        this.setSubmitError(await this.#errorMessage(response));
        return;
      }

      const { uuid, pollToken, expiresAt } = await response.json();

      this.setExpiresAt(expiresAt);
      this.setPanel('waiting');
      this.poller.start({ uuid, pollToken, expiresAt });
    } catch {
      this.setSubmitError(GENERIC_DEVICE_ERROR);
    }
  }

  /**
   * Clears all fields, errors and the device panel, and stops the poller.
   *
   * @returns {void}
   */
  handleClear() {
    this.stop();
    this.setLogin('');
    this.setPassword('');
    this.setKeepSignedIn(false);
    this.setIncorrect(false);
    this.setError(false);
    this.setSubmitError(null);
    this.setNetworkError(false);
    this.setExpiresAt(null);
    this.setPanel('form');
  }

  /**
   * Switches the modal mode, resetting everything.
   *
   * @param {string} mode target mode (`'password'` or `'device'`); unknown values fall back to
   *   `'password'`
   * @returns {void}
   */
  switchMode(mode) {
    const normalized = LOGIN_MODAL_MODES.includes(mode) ? mode : MODE_PASSWORD;

    this.handleClear();
    this.setMode(normalized);
  }

  /**
   * Restarts the device flow with an empty form.
   *
   * @returns {void}
   */
  tryAgain() {
    this.switchMode(MODE_DEVICE);
  }

  /**
   * Stops the authorization request poller.
   *
   * @returns {void}
   */
  stop() {
    this.poller.stop();
  }

  #assignSetters(setters) {
    this.setLogin = setters.setLogin;
    this.setPassword = setters.setPassword;
    this.setKeepSignedIn = setters.setKeepSignedIn;
    this.setIncorrect = setters.setIncorrect;
    this.setError = setters.setError;
    this.setMode = setters.setMode || noop;
    this.setPanel = setters.setPanel || noop;
    this.setSubmitError = setters.setSubmitError || noop;
    this.setNetworkError = setters.setNetworkError || noop;
    this.setExpiresAt = setters.setExpiresAt || noop;
  }

  #assignCollaborators({ onSuccess = null, client, requestsClient, poller }) {
    this.onSuccess = onSuccess;
    this.client = client || new LoginModalClient();
    this.requestsClient = requestsClient || new AuthorizationRequestsClient();
    this.poller = poller || new AuthorizationRequestPoller({
      client: this.requestsClient,
      onApproved: () => this.#handleApproved(),
      onFinal: (panel) => this.#handleFinal(panel),
      onNetworkError: (failing) => this.setNetworkError(failing),
    });
  }

  #succeed() {
    if (typeof this.onSuccess === 'function') {
      this.onSuccess();
    }
  }

  #handleApproved() {
    this.handleClear();
    this.#succeed();
  }

  #handleFinal(panel) {
    this.setNetworkError(false);
    this.setPanel(panel);
  }

  async #errorMessage(response) {
    try {
      const body = await response.json();

      return (body && body.message) || GENERIC_DEVICE_ERROR;
    } catch {
      return GENERIC_DEVICE_ERROR;
    }
  }

  #handleResponse(response) {
    if (response.ok) {
      this.handleClear();
      this.#succeed();

      return;
    }

    this.setPassword('');

    if (response.status >= 400 && response.status < 500) {
      this.setIncorrect(true);
      return;
    }

    this.setError(true);
  }

  #handleUnexpectedError() {
    this.setPassword('');
    this.setError(true);
  }
}
