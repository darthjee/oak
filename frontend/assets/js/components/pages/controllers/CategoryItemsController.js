import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';
import { isLoggedIn, subscribe } from '../../../utils/authState.js';

/**
 * Extracts the category slug from a category items hash route.
 *
 * @param {string} [hash=''] current location hash
 * @returns {string} category slug or an empty string when it cannot be resolved
 */
export function getCategorySlugFromHash(hash = '') {
  return Router.extractParams('/categories/:slug/items', hash).slug || '';
}

/**
 * Manages category items page state by fetching category items from the API and tracking login state.
 */
export default class CategoryItemsController extends BasePageController {
  /**
   * Creates a new CategoryItemsController instance.
   *
   * @param {Function} setItems state setter for updating the items list
   * @param {Function} setLogged state setter for updating the logged-in flag
   * @param {Function} setPagination state setter for updating the pagination info
   * @param {Function} setLoading state setter for updating the loading flag
   * @param {Function} setError state setter for updating the error message
   * @param {GenericClient|null} [client] optional client instance
   */
  constructor(
    setItems,
    setLogged,
    setPagination,
    setLoading,
    setError,
    client = null
  ) {
    super();
    this.setItems = setItems;
    this.setLogged = setLogged;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
  }

  /**
   * Builds the React effect that loads category items on mount and tracks login state.
   *
   * @returns {Function} effect function that starts data loading and returns a cleanup function
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const slug = getCategorySlugFromHash(this.client.currentHash());

      safeSet(this.setLogged, isLoggedIn());
      const unsubscribe = subscribe((logged) => safeSet(this.setLogged, logged));

      this.#loadData(safeSet, slug);

      return () => {
        mounted = false;
        unsubscribe();
      };
    };
  }

  #loadData(safeSet, slug) {
    this.#fetchItems(slug)
      .then((itemsData) => this.#applyData(safeSet, itemsData))
      .catch((error) => this.#handleError(safeSet, error))
      .finally(() => {
        safeSet(this.setLoading, false);
      });
  }

  #applyData(safeSet, itemsData) {
    safeSet(this.setItems, itemsData.items);
    safeSet(this.setPagination, itemsData.pagination);
  }

  #handleError(safeSet, error) {
    safeSet(this.setError, error?.message || 'Unexpected error while loading category items.');
  }

  #fetchItems(slug) {
    if (!slug) {
      return Promise.reject(new Error('Unable to load category items.'));
    }

    return this.client.fetchIndex(`/categories/${slug}/items.json`)
      .then(({ data, pagination }) => ({
        items: Array.isArray(data) ? data : [],
        pagination,
      }))
      .catch(() => { throw new Error('Unable to load category items.'); });
  }
}
