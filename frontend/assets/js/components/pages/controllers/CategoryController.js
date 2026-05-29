import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';

/**
 * Extracts category slug from a category hash route.
 *
 * @param {string} [hash=''] current location hash
 * @returns {string} category slug or an empty string when it cannot be resolved
 */
export function getCategorySlugFromHash(hash = '') {
  return Router.extractParams('/categories/:slug', hash).slug || '';
}

/**
 * Manages category page state by fetching category data from the API.
 */
export default class CategoryController extends BasePageController {
  /**
   * Creates a new CategoryController instance.
   *
   * @param {Function} setCategory state setter for category data
   * @param {Function} setLogged state setter for login status
   * @param {Function} setLoading state setter for loading status
   * @param {Function} setError state setter for error message
   * @param {GenericClient|null} [client] optional client instance
   */
  constructor(setCategory, setLogged, setLoading, setError, client = null) {
    super();
    this.setCategory = setCategory;
    this.setLogged = setLogged;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
  }

  /**
   * Builds the React effect that loads category data on mount.
   *
   * @returns {Function} effect function that starts loading and returns a cleanup function
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const slug = getCategorySlugFromHash(this.client.currentHash());

      this.#loadData(safeSet, slug);

      return () => {
        mounted = false;
      };
    };
  }

  #loadData(safeSet, slug) {
    this.#fetchCategoryAndLogin(slug)
      .then(this.#setCategoryState.bind(this, safeSet))
      .catch(this.#setErrorState.bind(this, safeSet))
      .finally(this.#setLoadingState.bind(this, safeSet));
  }

  #fetchCategoryAndLogin(slug) {
    return Promise.all([
      this.#fetchCategory(slug),
      this.checkLogin(),
    ]);
  }

  #setCategoryState(safeSet, [category, logged]) {
    safeSet(this.setCategory, category);
    safeSet(this.setLogged, logged);
  }

  #setErrorState(safeSet, error) {
    safeSet(this.setError, error?.message || 'Unable to load category.');
  }

  #setLoadingState(safeSet) {
    safeSet(this.setLoading, false);
  }

  #fetchCategory(slug) {
    if (!slug) {
      return Promise.reject(CategoryController.#buildLoadError());
    }

    return this.client.fetch(`/categories/${slug}.json`)
      .then(CategoryController.#normalizeCategory)
      .catch(CategoryController.#raiseLoadError);
  }

  static #normalizeCategory(category) {
    return {
      ...category,
      kinds: Array.isArray(category.kinds) ? category.kinds : [],
    };
  }

  static #raiseLoadError() {
    throw CategoryController.#buildLoadError();
  }

  static #buildLoadError() {
    return new Error('Unable to load category.');
  }
}
