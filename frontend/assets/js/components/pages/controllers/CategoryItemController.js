import GenericClient from '../../../client/GenericClient.js';
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
