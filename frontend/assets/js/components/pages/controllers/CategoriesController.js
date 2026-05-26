import GenericClient from '../../../client/GenericClient.js';

/**
 * Manages categories page state by fetching categories and login status from the API.
 */
export default class CategoriesController {
  /**
   * Creates a new CategoriesController instance.
   *
   * @param {Function} setCategories state setter for updating the categories list
   * @param {Function} setPagination state setter for updating the pagination info
   * @param {Function} setLogged state setter for updating the logged-in flag
   * @param {Function} setLoading state setter for updating the loading flag
   * @param {Function} setError state setter for updating the error message
   * @param {GenericClient|null} [client] optional client instance (defaults to new GenericClient)
   */
  constructor(
    setCategories,
    setPagination,
    setLogged,
    setLoading,
    setError,
    client = null
  ) {
    this.setCategories = setCategories;
    this.setPagination = setPagination;
    this.setLogged = setLogged;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
  }

  /**
   * Builds the React effect that loads categories and login data on mount.
   *
   * @returns {Function} effect function that starts data loading and returns a cleanup function
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.#buildSafeSetter(() => mounted);

      this.#loadData(safeSet);

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

  #loadData(safeSet) {
    Promise.all([
      this.#fetchCategories(),
      this.#checkLogin(),
    ])
      .then(([categoriesData, logged]) => this.#applyData(safeSet, categoriesData, logged))
      .catch((error) => this.#handleError(safeSet, error))
      .finally(() => {
        safeSet(this.setLoading, false);
      });
  }

  #applyData(safeSet, categoriesData, logged) {
    safeSet(this.setCategories, categoriesData.categories);
    safeSet(this.setPagination, categoriesData.pagination);
    safeSet(this.setLogged, logged);
  }

  #handleError(safeSet, error) {
    safeSet(this.setError, error?.message || 'Unexpected error while loading categories.');
  }

  #fetchCategories() {
    return this.client.fetchIndex('/categories.json')
      .then(({ data, pagination }) => ({
        categories: Array.isArray(data) ? data : [],
        pagination,
      }))
      .catch(() => { throw new Error('Unable to load categories.'); });
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
