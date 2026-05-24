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

      const safeSet = (setter, value) => {
        if (!mounted) {
          return;
        }

        setter(value);
      };

      Promise.all([
        this.#checkLogin(safeSet),
        this.#fetchCategories(safeSet),
      ])
        .catch((error) => {
          safeSet(this.setError, error.message || 'Unexpected error while loading header.');
        })
        .finally(() => {
          safeSet(this.setLoading, false);
        });

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
      .then(() => {
        this.setLogged(false);

        return this.#fetchCategories((setter, value) => setter(value));
      })
      .catch((error) => {
        this.setError(error.message || 'Unable to logoff.');
      });
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
}
