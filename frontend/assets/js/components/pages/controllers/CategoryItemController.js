import GenericClient from '../../../client/GenericClient.js';
import PhotoUploadClient from '../../../client/PhotoUploadClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';
import { isLoggedIn, subscribe } from '../../../utils/authState.js';

/**
 * Extracts category slug and item id from a category item hash route.
 *
 * @param {string} [hash=''] current location hash
 * @returns {{slug: string, id: string}} route params or empty values when unresolved
 */
export function getCategoryItemParamsFromHash(hash = '') {
  return {
    slug: '',
    id: '',
    ...Router.extractParams('/categories/:slug/items/:id', hash),
  };
}

/**
 * Manages category item page state by fetching the item from the API and tracking login state.
 */
export default class CategoryItemController extends BasePageController {
  /**
   * Creates a new CategoryItemController instance.
   *
   * @param {Function} setItem state setter for item data
   * @param {Function} setLogged state setter for login status
   * @param {Function} setLoading state setter for loading status
   * @param {Function} setError state setter for error message
   * @param {GenericClient|null} [client] optional client instance
   * @param {PhotoUploadClient|null} [uploadClient] optional photo upload client instance
   * @param {Function|null} [setDeletingPhotoId] state setter for the id of the photo currently
   *   being deleted
   * @param {Function|null} [setDeleteErrorByPhotoId] state setter for the per-photo delete
   *   error map (`{ [photoId]: message }`)
   */
  constructor(
    setItem,
    setLogged,
    setLoading,
    setError,
    client = null,
    uploadClient = null,
    setDeletingPhotoId = null,
    setDeleteErrorByPhotoId = null
  ) {
    super();
    this.setItem = setItem;
    this.setLogged = setLogged;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.uploadClient = uploadClient ?? new PhotoUploadClient();
    this.setDeletingPhotoId = setDeletingPhotoId;
    this.setDeleteErrorByPhotoId = setDeleteErrorByPhotoId;
  }

  /**
   * Builds the React effect that loads category item data on mount and tracks login state.
   *
   * @returns {Function} effect function that starts loading and returns a cleanup function
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const { slug, id } = getCategoryItemParamsFromHash(this.client.currentHash());

      safeSet(this.setLogged, isLoggedIn());
      const unsubscribe = subscribe((logged) => safeSet(this.setLogged, logged));

      this.#loadData(safeSet, slug, id);

      return () => {
        mounted = false;
        unsubscribe();
      };
    };
  }

  /**
   * Deletes a photo for the current item and refetches the item on success so the removed
   * photo disappears without a full page reload.
   *
   * @param {Object} item item being displayed
   * @param {number|string} photoId id of the photo to delete
   * @returns {Promise<void>} delete promise
   */
  deletePhoto(item, photoId) {
    const { slug, id } = getCategoryItemParamsFromHash(this.client.currentHash());

    if (!slug || !id || !photoId) {
      this.setDeleteErrorByPhotoId((current) => CategoryItemController.#withPhotoError(current, photoId));
      return Promise.reject(new Error('Unable to delete photo.'));
    }

    this.setDeletingPhotoId(photoId);
    this.setDeleteErrorByPhotoId((current) => CategoryItemController.#withoutPhotoError(current, photoId));

    return this.uploadClient.delete(slug, id, photoId)
      .then(() => this.#fetchItem(slug, id))
      .then((refetchedItem) => {
        this.setItem(refetchedItem);
      })
      .catch(() => {
        this.setDeleteErrorByPhotoId((current) => CategoryItemController.#withPhotoError(current, photoId));
      })
      .finally(() => {
        this.setDeletingPhotoId(null);
      });
  }

  static #withPhotoError(current, photoId) {
    return { ...current, [photoId]: 'Unable to delete photo.' };
  }

  static #withoutPhotoError(current, photoId) {
    const next = { ...current };
    delete next[photoId];
    return next;
  }

  #loadData(safeSet, slug, id) {
    this.#fetchItem(slug, id)
      .then((item) => this.#applyData(safeSet, item))
      .catch((error) => this.#handleError(safeSet, error))
      .finally(() => {
        safeSet(this.setLoading, false);
      });
  }

  #applyData(safeSet, item) {
    safeSet(this.setItem, item);
  }

  #handleError(safeSet, error) {
    safeSet(this.setError, error?.message || 'Unable to load category item.');
  }

  #fetchItem(slug, id) {
    if (!slug || !id) {
      return Promise.reject(new Error('Unable to load category item.'));
    }

    return this.client.fetch(`/categories/${slug}/items/${id}.json`)
      .catch(() => { throw new Error('Unable to load category item.'); });
  }
}
