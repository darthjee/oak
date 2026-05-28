import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';

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
 * Manages category item page state by fetching item and login status from the API.
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
   */
  constructor(setItem, setLogged, setLoading, setError, client = null) {
    super();
    this.setItem = setItem;
    this.setLogged = setLogged;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
  }

  /**
   * Builds the React effect that loads category item data and login status on mount.
   *
   * @returns {Function} effect function that starts loading and returns a cleanup function
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const { slug, id } = getCategoryItemParamsFromHash(this.client.currentHash());

      this.#loadData(safeSet, slug, id);

      return () => {
        mounted = false;
      };
    };
  }

  #loadData(safeSet, slug, id) {
    Promise.all([
      this.#fetchItem(slug, id),
      this.checkLogin(),
    ])
      .then(([item, logged]) => this.#applyData(safeSet, item, logged))
      .catch((error) => this.#handleError(safeSet, error))
      .finally(() => {
        safeSet(this.setLoading, false);
      });
  }

  #applyData(safeSet, item, logged) {
    safeSet(this.setItem, item);
    safeSet(this.setLogged, logged);
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
