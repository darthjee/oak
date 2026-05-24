export default class HeaderController {
  constructor(setLogged, setCategories, setLoading, setError) {
    this.setLogged = setLogged;
    this.setCategories = setCategories;
    this.setLoading = setLoading;
    this.setError = setError;

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

    return fetch('/users/logoff', {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    })
      .then(() => this.#handleLogoffSuccess())
      .catch((error) => this.#handleError(error, 'Unable to logoff.'));
  }

  #checkLogin(safeSet) {
    return fetch('/users/login.json', {
      headers: { Accept: 'application/json' },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }

        if ([401, 403, 404].includes(response.status)) {
          return null;
        }

        throw new Error('Unable to check login status.');
      })
      .then((session) => {
        safeSet(this.setLogged, Boolean(session));
      });
  }

  #fetchCategories(safeSet) {
    return fetch('/user/categories.json', {
      headers: { Accept: 'application/json' },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load categories.');
        }

        return response.json();
      })
      .then((payload) => {
        const categories = Array.isArray(payload) ? payload : [];

        safeSet(this.setCategories, categories);
      });
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
