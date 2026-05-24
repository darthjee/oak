export default class CategoriesController {
  constructor(setCategories, setLogged, setLoading, setError) {
    this.setCategories = setCategories;
    this.setLogged = setLogged;
    this.setLoading = setLoading;
    this.setError = setError;
  }

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
      .then(([categories, logged]) => this.#applyData(safeSet, categories, logged))
      .catch((error) => this.#handleError(safeSet, error))
      .finally(() => {
        safeSet(this.setLoading, false);
      });
  }

  #applyData(safeSet, categories, logged) {
    safeSet(this.setCategories, categories);
    safeSet(this.setLogged, logged);
  }

  #handleError(safeSet, error) {
    safeSet(this.setError, error?.message || 'Unexpected error while loading categories.');
  }

  #fetchCategories() {
    return fetch('/categories.json', {
      headers: { Accept: 'application/json' },
    })
      .then((response) => this.#handleCategoriesResponse(response))
      .then((payload) => this.#normalizePayload(payload));
  }

  #handleCategoriesResponse(response) {
    if (!response.ok) {
      throw new Error('Unable to load categories.');
    }

    return response.json();
  }

  #normalizePayload(payload) {
    return Array.isArray(payload) ? payload : [];
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
