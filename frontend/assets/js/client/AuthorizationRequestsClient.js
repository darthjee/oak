/**
 * HTTP client for device authorization request endpoints.
 */
export default class AuthorizationRequestsClient {
  /**
   * Creates a new authorization request for the given login.
   *
   * @param {string} login login name requesting authorization
   * @param {boolean} [keepSignedIn=false] whether the session should persist
   * @returns {Promise<Response>} fetch response from the create endpoint
   */
  create(login, keepSignedIn = false) {
    return this.#post('/auth/authorization-requests.json', {
      login,
      keepSignedIn: Boolean(keepSignedIn),
    });
  }

  /**
   * Polls the status of an authorization request.
   *
   * @param {string} uuid authorization request identifier
   * @param {string} pollToken secret token returned on creation
   * @returns {Promise<Response>} fetch response from the poll endpoint
   */
  poll(uuid, pollToken) {
    return this.#post(
      `/auth/authorization-requests/${encodeURIComponent(uuid)}/poll.json`,
      { pollToken }
    );
  }

  /**
   * Sends a JSON POST request.
   *
   * @param {string} path request path
   * @param {object} body request payload
   * @returns {Promise<Response>} fetch response
   */
  #post(path, body) {
    return fetch(path, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Skip-Cache': '1',
      },
      body: JSON.stringify(body),
    });
  }
}
