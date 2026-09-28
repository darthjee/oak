import { isLoggedIn } from '../utils/authState.js';

/**
 * A client for the proxy-only photo migration endpoint (`POST /migrations/photos`).
 *
 * It does not extend `GenericClient` because the endpoint is served by the proxy, without
 * the `.json` suffix and the backend path conventions, so this client talks to `fetch` directly.
 */
export default class PhotoMigrationClient {
  /**
   * Migrates one batch of the logged-in user's legacy photos.
   *
   * @param {number} limit maximum number of photos to migrate in this batch
   * @returns {Promise<{migrated: number, missing: number[], failed: Array<{id: number, reason: string}>, remaining: number}>}
   *   the batch result
   * @throws {Error} if the response is not ok; the error carries the HTTP `status`
   */
  async migrate(limit) {
    const path = `/migrations/photos?limit=${limit}`;

    const response = await fetch(path, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...this.#skipCacheHeader(),
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const error = new Error(`Request failed for ${path}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  /**
   * Builds the `X-Skip-Cache` header when the user is logged in, so the request is never
   * served from a cache.
   *
   * @returns {Object} headers object, possibly containing `X-Skip-Cache`
   */
  #skipCacheHeader() {
    return isLoggedIn() ? { 'X-Skip-Cache': '1' } : {};
  }
}
