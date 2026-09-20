import GenericClient from '../../../client/GenericClient.js';
import PhotoUploadClient from '../../../client/PhotoUploadClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';

/**
 * Extracts category slug and item id from a category item edit hash route.
 *
 * @param {string} [hash=''] current location hash
 * @returns {{slug: string, id: string}} route params or empty values when unresolved
 */
export function getCategoryItemEditParamsFromHash(hash = '') {
  return {
    slug: '',
    id: '',
    ...Router.extractParams('/categories/:slug/items/:id/edit', hash),
  };
}

/**
 * Manages category item edit page state and save flow.
 */
export default class CategoryItemEditController extends BasePageController {
  /**
   * Creates a new CategoryItemEditController instance.
   *
   * @param {Function} setItem state setter for item data
   * @param {Function} setKinds state setter for kinds list
   * @param {Function} setLoading state setter for loading status
   * @param {Function} setSaving state setter for saving status
   * @param {Function} setError state setter for error message
   * @param {GenericClient|null} [client] optional client instance
   * @param {Object|null} [locationTarget] optional location target used for redirects
   * @param {Function|null} [setUploading] state setter for photo upload status
   * @param {Function|null} [setUploadError] state setter for photo upload error message
   * @param {PhotoUploadClient|null} [uploadClient] optional photo upload client instance
   * @param {Function|null} [setDeletingPhotoId] state setter for the id of the photo currently
   *   being deleted
   * @param {Function|null} [setDeleteErrorByPhotoId] state setter for the per-photo delete
   *   error map (`{ [photoId]: message }`)
   */
  constructor(
    setItem,
    setKinds,
    setLoading,
    setSaving,
    setError,
    client = null,
    locationTarget = null,
    setUploading = null,
    setUploadError = null,
    uploadClient = null,
    setDeletingPhotoId = null,
    setDeleteErrorByPhotoId = null
  ) {
    super();
    this.setItem = setItem;
    this.setKinds = setKinds;
    this.setLoading = setLoading;
    this.setSaving = setSaving;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.locationTarget = locationTarget ?? CategoryItemEditController.#defaultLocationTarget();
    this.setUploading = setUploading;
    this.setUploadError = setUploadError;
    this.uploadClient = CategoryItemEditController.#resolveUploadClient(uploadClient);
    this.setDeletingPhotoId = setDeletingPhotoId;
    this.setDeleteErrorByPhotoId = setDeleteErrorByPhotoId;
  }

  /**
   * Builds the fallback location target used when none is injected, matching `window.location`
   * in the browser and a plain object with an empty hash outside of it (e.g. in tests).
   *
   * @returns {Object} fallback location target
   */
  static #defaultLocationTarget() {
    return typeof window === 'undefined' ? { hash: '' } : window.location;
  }

  /**
   * Resolves the photo upload client to use, defaulting to a new `PhotoUploadClient` instance
   * when none is injected.
   *
   * @param {PhotoUploadClient|null} uploadClient optional injected photo upload client
   * @returns {PhotoUploadClient} the client to use
   */
  static #resolveUploadClient(uploadClient) {
    return uploadClient ?? new PhotoUploadClient();
  }

  /**
   * Builds the React effect that loads category item and kinds on mount.
   *
   * @returns {Function} effect function that starts loading and returns a cleanup function
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const { slug, id } = getCategoryItemEditParamsFromHash(this.client.currentHash());

      this.#loadData(safeSet, slug, id);

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Persists edited item data and redirects to the item details page on success.
   *
   * @param {Object} item edited item state
   * @returns {Promise<void>} save promise
   */
  save(item) {
    const { slug, id } = getCategoryItemEditParamsFromHash(this.client.currentHash());

    if (!slug || !id || !item) {
      this.setError('Unable to save category item.');
      return Promise.reject(new Error('Unable to save category item.'));
    }

    this.setSaving(true);
    this.setError(null);

    return this.client.patch(`/categories/${slug}/items/${id}.json`, this.#buildPayload(item))
      .then(() => {
        this.locationTarget.hash = `#/categories/${slug}/items/${id}`;
      })
      .catch(() => {
        this.setError('Unable to save category item.');
      })
      .finally(() => {
        this.setSaving(false);
      });
  }

  /**
   * Uploads a photo file for the current item and refetches the item on success so the
   * newly-uploaded (already-ready) photo appears without a full page reload.
   *
   * @param {Object} item item being edited
   * @param {File} file file selected for upload
   * @returns {Promise<void>} upload promise
   */
  uploadPhoto(item, file) {
    const { slug, id } = getCategoryItemEditParamsFromHash(this.client.currentHash());

    if (!slug || !id || !file) {
      this.setUploadError('Unable to upload photo.');
      return Promise.reject(new Error('Unable to upload photo.'));
    }

    this.setUploading(true);
    this.setUploadError(null);

    return this.uploadClient.upload(slug, id, file)
      .then(() => this.#fetchItem(slug, id))
      .then((refetchedItem) => {
        this.setItem(this.#normalizeItem(refetchedItem));
      })
      .catch(() => {
        this.setUploadError('Unable to upload photo.');
      })
      .finally(() => {
        this.setUploading(false);
      });
  }

  /**
   * Deletes a photo for the current item and refetches the item on success so the removed
   * photo disappears without a full page reload.
   *
   * @param {Object} item item being edited
   * @param {number|string} photoId id of the photo to delete
   * @returns {Promise<void>} delete promise
   */
  deletePhoto(item, photoId) {
    const { slug, id } = getCategoryItemEditParamsFromHash(this.client.currentHash());

    if (!slug || !id || !photoId) {
      this.setDeleteErrorByPhotoId((current) => this.#withPhotoError(current, photoId));
      return Promise.reject(new Error('Unable to delete photo.'));
    }

    this.setDeletingPhotoId(photoId);
    this.setDeleteErrorByPhotoId((current) => this.#withoutPhotoError(current, photoId));

    return this.uploadClient.delete(slug, id, photoId)
      .then(() => this.#fetchItem(slug, id))
      .then((refetchedItem) => {
        this.setItem(this.#normalizeItem(refetchedItem));
      })
      .catch(() => {
        this.setDeleteErrorByPhotoId((current) => this.#withPhotoError(current, photoId));
      })
      .finally(() => {
        this.setDeletingPhotoId(null);
      });
  }

  #withPhotoError(current, photoId) {
    return { ...current, [photoId]: 'Unable to delete photo.' };
  }

  #withoutPhotoError(current, photoId) {
    const next = { ...current };
    Reflect.deleteProperty(next, photoId);
    return next;
  }

  #loadData(safeSet, slug, id) {
    Promise.all([
      this.#fetchItem(slug, id),
      this.#fetchKinds(slug),
    ])
      .then(([item, kinds]) => this.#applyLoadedData(safeSet, item, kinds))
      .catch((error) => {
        safeSet(this.setError, error?.message || 'Unable to load category item edit form.');
      })
      .finally(() => {
        safeSet(this.setLoading, false);
      });
  }

  #normalizeItem(item) {
    return {
      ...item,
      kind_slug: item.kind_slug || item.kind?.slug || '',
      links: Array.isArray(item.links) ? item.links : [],
    };
  }

  #buildPayload(item) {
    return {
      item: {
        name: item.name || '',
        description: item.description || '',
        kind_slug: item.kind_slug || '',
        visible: item.visible,
        links: this.#buildLinkPayload(item.links),
      },
    };
  }

  #applyLoadedData(safeSet, item, kinds) {
    safeSet(this.setItem, this.#normalizeItem(item));
    safeSet(this.setKinds, kinds);
  }

  #buildLinkPayload(links) {
    return (Array.isArray(links) ? links : []).map((link, index) => ({
      id: link.id,
      text: link.text || '',
      url: link.url || '',
      order: link.order ?? index + 1,
    }));
  }

  #fetchItem(slug, id) {
    if (!slug || !id) {
      return Promise.reject(new Error('Unable to load category item edit form.'));
    }

    return this.client.fetch(`/categories/${slug}/items/${id}.json`)
      .catch(() => { throw new Error('Unable to load category item edit form.'); });
  }

  #fetchKinds(slug) {
    if (!slug) {
      return Promise.reject(new Error('Unable to load category item edit form.'));
    }

    return this.client.fetch(`/categories/${slug}/kinds.json`)
      .then((kinds) => (Array.isArray(kinds) ? kinds : []))
      .catch(() => { throw new Error('Unable to load category item edit form.'); });
  }
}
