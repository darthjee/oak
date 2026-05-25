import LoginModalClient from './LoginModalClient.js';

/**
 * Manages login modal state and login requests.
 */
export default class LoginModalController {
  /**
   * Creates a new LoginModalController instance.
   *
   * @param {Function} setLogin state setter for the login field
   * @param {Function} setPassword state setter for the password field
   * @param {Function} setIncorrect state setter for invalid credential errors
   * @param {Function} setError state setter for unexpected errors
   * @param {Function|null} [onSuccess] callback invoked after a successful login
   * @param {LoginModalClient} [client] HTTP client used for login requests
   */
  constructor(
    setLogin,
    setPassword,
    setIncorrect,
    setError,
    onSuccess = null,
    client = new LoginModalClient()
  ) {
    this.setLogin = setLogin;
    this.setPassword = setPassword;
    this.setIncorrect = setIncorrect;
    this.setError = setError;
    this.onSuccess = onSuccess;
    this.client = client;
  }

  /**
   * Submits the login request using the provided credentials.
   *
   * @param {string} login login name to submit
   * @param {string} password password to submit
   * @returns {Promise<void>} resolves when the request handling finishes
   */
  async handleSubmit(login, password) {
    this.setIncorrect(false);
    this.setError(false);

    try {
      const response = await this.client.submit(login, password);

      this.#handleResponse(response);
    } catch {
      this.#handleUnexpectedError();
    }
  }

  /**
   * Clears the login modal form state.
   *
   * @returns {void}
   */
  handleClear() {
    this.setLogin('');
    this.setPassword('');
    this.setIncorrect(false);
    this.setError(false);
  }

  #handleResponse(response) {
    if (response.ok) {
      this.handleClear();

      if (typeof this.onSuccess === 'function') {
        this.onSuccess();
      }

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
