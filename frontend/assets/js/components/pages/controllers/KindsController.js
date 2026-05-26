import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';

/**
 * Manages kinds page state by fetching kinds and login status from the API.
 */
export default class KindsController extends BasePageController {
  /**
   * Creates a new KindsController instance.
   *
   * @param {Function} setKinds state setter for updating the kinds list
   * @param {Function} setPagination state setter for updating the pagination info
   * @param {Function} setLogged state setter for updating the logged-in flag
   * @param {Function} setLoading state setter for updating the loading flag
   * @param {Function} setError state setter for updating the error message
   * @param {GenericClient|null} [client] optional client instance (defaults to new GenericClient)
   */
  constructor(
    setKinds,
    setPagination,
    setLogged,
    setLoading,
    setError,
    client = null
  ) {
    super();
    this.setKinds = setKinds;
    this.setPagination = setPagination;
    this.setLogged = setLogged;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
  }

  /**
   * Builds the React effect that loads kinds and login data on mount.
   *
   * @returns {Function} effect function that starts data loading and returns a cleanup function
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      this.#loadData(safeSet);

      return () => {
        mounted = false;
      };
    };
  }

  #loadData(safeSet) {
    Promise.all([
      this.#fetchKinds(),
      this.checkLogin(),
    ])
      .then(([kindsData, logged]) => this.#applyData(safeSet, kindsData, logged))
      .catch((error) => this.#handleError(safeSet, error))
      .finally(() => {
        safeSet(this.setLoading, false);
      });
  }

  #applyData(safeSet, kindsData, logged) {
    safeSet(this.setKinds, kindsData.kinds);
    safeSet(this.setPagination, kindsData.pagination);
    safeSet(this.setLogged, logged);
  }

  #handleError(safeSet, error) {
    safeSet(this.setError, error?.message || 'Unexpected error while loading kinds.');
  }

  #fetchKinds() {
    return this.client.fetchIndex('/kinds.json')
      .then(({ data, pagination }) => this.#buildKindsData(data, pagination))
      .catch(() => { throw new Error('Unable to load kinds.'); });
  }

  #buildKindsData(data, pagination) {
    return {
      kinds: Array.isArray(data) ? data : [],
      pagination,
    };
  }
}
