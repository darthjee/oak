/**
 * HTTP client for header-related API calls.
 */
export default class HeaderClient {
  /**
   * Checks the current user login status.
   *
   * @returns {Promise<Response>} fetch response from the login status endpoint
   */
  checkLogin() {
    return fetch('/users/login.json', {
      headers: { Accept: 'application/json', 'X-Skip-Cache': '1' },
    });
  }

  /**
   * Fetches the list of categories visible to the current user.
   *
   * @returns {Promise<Response>} fetch response from the categories endpoint
   */
  fetchCategories() {
    return fetch('/user/categories.json', {
      headers: { Accept: 'application/json' },
    });
  }

  /**
   * Sends a DELETE request to log the current user out.
   *
   * @returns {Promise<Response>} fetch response from the logoff endpoint
   */
  logoff() {
    return fetch('/users/logoff.json', {
      method: 'DELETE',
      headers: { Accept: 'application/json', 'X-Skip-Cache': '1' },
    });
  }
}
