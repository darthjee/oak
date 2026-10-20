/**
 * HTTP client for login modal requests.
 */
export default class LoginModalClient {
  /**
   * Submits the login request.
   *
   * @param {string} login login name to submit
   * @param {string} password password to submit
   * @param {boolean} [keepSignedIn=false] whether the session should persist
   * @returns {Promise<Response>} fetch response from the login endpoint
   */
  submit(login, password, keepSignedIn = false) {
    return fetch('/users/login.json', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Skip-Cache': '1',
      },
      body: JSON.stringify({
        login: { login, password, keepSignedIn: Boolean(keepSignedIn) },
      }),
    });
  }
}
