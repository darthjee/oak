import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';
import { isLoggedIn, subscribe } from '../../../utils/authState.js';

/**
 * Extracts kind slug from a kind hash route.
 *
 * @param {string} [hash=''] current location hash
 * @returns {string} kind slug or an empty string when it cannot be resolved
 */
export function getKindSlugFromHash(hash = '') {
  return Router.extractParams('/kinds/:slug', hash).slug || '';
}

/**
 * Manages kind page state by fetching kind data from the API and tracking login state.
 */
export default class KindController extends BasePageController {
  /**
   * Creates a new KindController instance.
   *
   * @param {Function} setKind state setter for kind data
   * @param {Function} setLogged state setter for login status
   * @param {Function} setLoading state setter for loading status
   * @param {Function} setError state setter for error message
   * @param {GenericClient|null} [client] optional client instance
   */
  constructor(setKind, setLogged, setLoading, setError, client = null) {
    super();
    this.setKind = setKind;
    this.setLogged = setLogged;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
  }

  /**
   * Builds the React effect that loads kind data on mount and tracks login state.
   *
   * @returns {Function} effect function that starts loading and returns a cleanup function
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const slug = getKindSlugFromHash(this.client.currentHash());

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
    this.#fetchKind(slug)
      .then(this.#setKindState.bind(this, safeSet))
      .catch(this.#setErrorState.bind(this, safeSet))
      .finally(this.#setLoadingState.bind(this, safeSet));
  }

  #setKindState(safeSet, kind) {
    safeSet(this.setKind, kind);
  }

  #setErrorState(safeSet, error) {
    safeSet(this.setError, error?.message || 'Unable to load kind.');
  }

  #setLoadingState(safeSet) {
    safeSet(this.setLoading, false);
  }

  #fetchKind(slug) {
    if (!slug) {
      return Promise.reject(KindController.#buildLoadError());
    }

    return this.client.fetch(`/kinds/${slug}.json`)
      .catch(KindController.#raiseLoadError);
  }

  static #raiseLoadError() {
    throw KindController.#buildLoadError();
  }

  static #buildLoadError() {
    return new Error('Unable to load kind.');
  }
}
