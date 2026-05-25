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
   */
  constructor(setLogin, setPassword, setIncorrect, setError, onSuccess = null) {
    this.setLogin = setLogin;
    this.setPassword = setPassword;
    this.setIncorrect = setIncorrect;
    this.setError = setError;
    this.onSuccess = onSuccess;
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
      const response = await fetch('/users/login.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: { login, password },
        }),
      });

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
    } catch {
      this.setPassword('');
      this.setError(true);
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
}
