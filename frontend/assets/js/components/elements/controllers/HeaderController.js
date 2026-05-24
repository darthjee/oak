import HeaderClient from './HeaderClient.js';

export default class HeaderController {
  constructor(setLogged, setCategories, setLoading, setError, client = new HeaderClient()) {
    this.setLogged = setLogged;
    this.setCategories = setCategories;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client;

    this.handleLogoff = this.handleLogoff.bind(this);
  }

  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.#buildSafeSetter(() => mounted);

      this.#loadHeaderData(safeSet);

      return () => {
        mounted = false;
      };
    };
  }

  handleLogoff(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    return this.client.logoff()
      .then(() => this.#handleLogoffSuccess())
      .catch((error) => this.#handleError(error, 'Unable to logoff.'));
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
    Promise.all([
      this.#checkLogin(safeSet),
      this.#fetchCategories(safeSet),
    ])
      .catch((error) => this.#handleSafeError(safeSet, error, 'Unexpected error while loading header.'))
      .finally(() => {
        safeSet(this.setLoading, false);
      });
  }

  #handleLogoffSuccess() {
    this.setLogged(false);

    return this.#fetchCategories(this.#unsafeSet.bind(this));
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
