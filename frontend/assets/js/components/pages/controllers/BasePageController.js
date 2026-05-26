/**
 * Shared behavior for page controllers.
 */
export default class BasePageController {
  /**
   * Fetches login status for the current user.
   *
   * @returns {Promise<boolean>} whether the user is logged in
   */
  checkLogin() {
    return fetch('/users/login.json', {
      headers: { Accept: 'application/json' },
    })
      .then((response) => this.handleLoginResponse(response));
  }

  /**
   * Parses login response into a boolean login state.
   *
   * @param {Response} response fetch response
   * @returns {Promise<boolean>|boolean} login state when response can be handled
   */
  handleLoginResponse(response) {
    if (response.ok) {
      return response.json().then(Boolean);
    }

    if ([401, 403, 404].includes(response.status)) {
      return false;
    }

    throw new Error('Unable to check login status.');
  }
}
