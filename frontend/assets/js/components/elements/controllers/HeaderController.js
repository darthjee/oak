import HeaderClient from '../../../client/HeaderClient.js';

/**
 * Manages header state by fetching login status and categories from the API.
 */
export default class HeaderController {
  /**
   * Creates a new HeaderController instance.
   *
   * @param {Function} setLogged state setter for updating the logged-in flag
   * @param {Function} setCategories state setter for updating the categories list
   * @param {Function} setLoading state setter for updating the loading flag
   * @param {Function} setError state setter for updating the error message
   * @param {HeaderClient} [client] HTTP client used for API calls
   */
  constructor(
    setLogged,
    setCategories,
    setLoading,
    setError,
    client = new HeaderClient()
  ) {
    this.setLogged = setLogged;
    this.setCategories = setCategories;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client;

    this.handleLogoff = this.handleLogoff.bind(this);
    this.reload = this.reload.bind(this);
  }

  /**
   * Builds the React effect that loads header data on mount.
   *
   * @returns {Function} effect function that starts data loading and returns a cleanup function
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.#buildSafeSetter(() => mounted);

      this.reload(safeSet);

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Handles a logoff action triggered by the user.
   *
   * @param {Event} [event] optional DOM event; `preventDefault` is called when present
   * @returns {Promise<void>} resolves when logoff is complete
   */
  handleLogoff(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    return this.client.logoff()
      .then(() => this.reload())
      .catch((error) => this.#handleError(error, 'Unable to logoff.'));
  }

  /**
   * Reloads the header data.
   *
   * @param {Function} [safeSet] state setter wrapper, defaults to direct setters
   * @returns {Promise<void>} resolves when header data loading finishes
   */
  reload(safeSet = this.#unsafeSet.bind(this)) {
    safeSet(this.setLoading, true);
    safeSet(this.setError, null);

    return this.#loadHeaderData(safeSet);
  }

  #checkLogin(safeSet) {
    return this.client.checkLogin()
      .then((response) => this.#parseLoginResponse(response))
      .then((session) => this.#setLoggedFromSession(safeSet, session));
  }

  #fetchCategories(safeSet) {
    return this.client.fetchCategories()
      .then((response) => this.#parseCategoriesResponse(response))
      .then((payload) => this.#setCategoriesFromPayload(safeSet, payload));
  }

  #buildSafeSetter(isMounted) {
    return (setter, value) => {
      if (!isMounted()) {
        return;
      }

      setter(value);
    };
  }

  #loadHeaderData(safeSet) {
    return Promise.all([
      this.#checkLogin(safeSet),
      this.#fetchCategories(safeSet),
    ])
      .catch((error) => this.#handleSafeError(safeSet, error, 'Unexpected error while loading header.'))
      .finally(() => {
        safeSet(this.setLoading, false);
      });
  }

  #parseLoginResponse(response) {
    if (response.ok) {
      return response.json();
    }

    if ([401, 403, 404].includes(response.status)) {
      return null;
    }

    throw new Error('Unable to check login status.');
  }

  #setLoggedFromSession(safeSet, session) {
    safeSet(this.setLogged, Boolean(session));
  }

  #parseCategoriesResponse(response) {
    if (!response.ok) {
      throw new Error('Unable to load categories.');
    }

    return response.json();
  }

  #setCategoriesFromPayload(safeSet, payload) {
    const categories = Array.isArray(payload) ? payload : [];

    safeSet(this.setCategories, categories);
  }

  #handleSafeError(safeSet, error, fallbackMessage) {
    safeSet(this.setError, this.#resolveErrorMessage(error, fallbackMessage));
  }

  #handleError(error, fallbackMessage) {
    this.setError(this.#resolveErrorMessage(error, fallbackMessage));
  }

  #resolveErrorMessage(error, fallbackMessage) {
    return error?.message || fallbackMessage;
  }

  #unsafeSet(setter, value) {
    setter(value);
  }
}
