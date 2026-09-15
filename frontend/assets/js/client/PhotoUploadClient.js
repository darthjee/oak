import { isLoggedIn } from '../utils/authState.js';

/**
 * A client that drives the Init -> Submit steps of the photo upload flow for a single file.
 *
 * It does not extend `GenericClient` because `GenericClient`'s `post`/`patch` always send
 * JSON (`Content-Type: application/json`), while Submit needs `multipart/form-data`, so this
 * client talks to `fetch` directly.
 */
export default class PhotoUploadClient {
  /**
   * Initializes a photo upload by creating a pending photo record for the given item.
   *
   * @param {string} categorySlug slug of the category the item belongs to
   * @param {number|string} itemId id of the item the photo belongs to
   * @param {string} fileName name of the file being uploaded
   * @returns {Promise<{id: number, file_name: string, ready: boolean}>} the created photo
   * @throws {Error} if the response is not ok
   */
  async init(categorySlug, itemId, fileName) {
    const response = await fetch(`/categories/${categorySlug}/items/${itemId}/photos.json`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...this.#skipCacheHeader(),
      },
      body: JSON.stringify({ photo: { file_name: fileName } }),
    });

    if (!response.ok) {
      throw new Error(`Request failed for /categories/${categorySlug}/items/${itemId}/photos.json`);
    }

    return response.json();
  }

  /**
   * Submits the file content for a previously initialized photo.
   *
   * @param {string} categorySlug slug of the category the item belongs to
   * @param {number|string} itemId id of the item the photo belongs to
   * @param {number|string} photoId id of the photo returned by `init`
   * @param {File|Blob} file file content to upload
   * @returns {Promise<void>} resolves when the submit succeeds
   * @throws {Error} if the response is not ok
   */
  async submit(categorySlug, itemId, photoId, file) {
    const path = `/uploads/categories/${categorySlug}/items/${itemId}/photos/${photoId}/submit`;
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(path, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...this.#skipCacheHeader(),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Request failed for ${path}`);
    }
  }

  /**
   * Uploads a file for the given item, sequencing Init and Submit.
   *
   * The frontend never calls Finalize: by the time Submit resolves, the proxy's Tent
   * handler has already marked the photo `ready: true` on the backend.
   *
   * @param {string} categorySlug slug of the category the item belongs to
   * @param {number|string} itemId id of the item the photo belongs to
   * @param {File} file file to upload
   * @returns {Promise<{id: number, file_name: string, ready: boolean}>} the created photo
   * @throws {Error} if either the init or submit request fails
   */
  async upload(categorySlug, itemId, file) {
    const photo = await this.init(categorySlug, itemId, file.name);

    await this.submit(categorySlug, itemId, photo.id, file);

    return photo;
  }

  /**
   * Builds the `X-Skip-Cache` header when the user is logged in, so `require_user_for`
   * and ownership checks pass for Init and Submit.
   *
   * @returns {Object} headers object, possibly containing `X-Skip-Cache`
   */
  #skipCacheHeader() {
    return isLoggedIn() ? { 'X-Skip-Cache': '1' } : {};
  }
}
