import GenericClient from '../../../client/GenericClient.js';

/**
 * Extracts the category slug from a category items hash route.
 *
 * @param {string} [hash=''] current location hash
 * @returns {string} category slug or an empty string when it cannot be resolved
 */
export function getCategorySlugFromHash(hash = '') {
  const path = hash.split('?')[0];
  const match = path.match(/^#\/categories\/([^/]+)\/items\/?$/);

  return match?.[1] || '';
}

/**
 * Manages category items page state by fetching category items and login status from the API.
 */
export default class CategoryItemsController {
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
    this.setItems = setItems;
    this.setLogged = setLogged;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
  }

  /**
   * Builds the React effect that loads category items and login data on mount.
   *
   * @returns {Function} effect function that starts data loading and returns a cleanup function
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.#buildSafeSetter(() => mounted);
      const slug = getCategorySlugFromHash(this.client.currentHash());

      this.#loadData(safeSet, slug);

      return () => {
        mounted = false;
      };
    };
  }

  #buildSafeSetter(isMounted) {
    return (setter, value) => {
      if (!isMounted()) {
        return;
      }

      setter(value);
    };
  }

  #loadData(safeSet, slug) {
    Promise.all([
      this.#fetchItems(slug),
      this.#checkLogin(),
    ])
      .then(([itemsData, logged]) => this.#applyData(safeSet, itemsData, logged))
      .catch((error) => this.#handleError(safeSet, error))
      .finally(() => {
        safeSet(this.setLoading, false);
      });
  }

  #applyData(safeSet, itemsData, logged) {
    safeSet(this.setItems, itemsData.items);
    safeSet(this.setPagination, itemsData.pagination);
    safeSet(this.setLogged, logged);
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

  #checkLogin() {
    return fetch('/users/login.json', {
      headers: { Accept: 'application/json' },
    })
      .then((response) => this.#handleLoginResponse(response));
  }

  #handleLoginResponse(response) {
    if (response.ok) {
      return response.json().then(Boolean);
    }

    if ([401, 403, 404].includes(response.status)) {
      return false;
    }

    throw new Error('Unable to check login status.');
  }
}
