import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import { isLoggedIn, subscribe } from '../../../utils/authState.js';

/**
 * Manages categories page state by fetching categories and login status from the API.
 */
export default class CategoriesController extends BasePageController {
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
    super();
    this.setCategories = setCategories;
    this.setPagination = setPagination;
    this.setLogged = setLogged;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
  }

  /**
   * Builds the React effect that loads categories on mount and tracks login state.
   *
   * @returns {Function} effect function that starts data loading and returns a cleanup function
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      safeSet(this.setLogged, isLoggedIn());
      const unsubscribe = subscribe((logged) => safeSet(this.setLogged, logged));

      this.#loadData(safeSet);

      return () => {
        mounted = false;
        unsubscribe();
      };
    };
  }

  #loadData(safeSet) {
    this.#fetchCategories()
      .then((categoriesData) => this.#applyData(safeSet, categoriesData))
      .catch((error) => this.#handleError(safeSet, error))
      .finally(() => {
        safeSet(this.setLoading, false);
      });
  }

  #applyData(safeSet, categoriesData) {
    safeSet(this.setCategories, categoriesData.categories);
    safeSet(this.setPagination, categoriesData.pagination);
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
}
