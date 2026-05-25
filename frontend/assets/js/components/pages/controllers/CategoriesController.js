export default class CategoriesController {
  constructor(setCategories, setPagination, setLogged, setLoading, setError) {
    this.setCategories = setCategories;
    this.setPagination = setPagination;
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
    return fetch('/categories.json', {
      headers: { Accept: 'application/json' },
    })
      .then((response) => this.#handleCategoriesResponse(response))
      .then(({ payload, pagination }) => this.#normalizeCategoriesData(payload, pagination));
  }

  #handleCategoriesResponse(response) {
    if (!response.ok) {
      throw new Error('Unable to load categories.');
    }

    const pagination = this.#extractPagination(response);

    return response.json().then((payload) => ({ payload, pagination }));
  }

  #normalizeCategoriesData(payload, pagination) {
    return {
      categories: Array.isArray(payload) ? payload : [],
      pagination,
    };
  }

  #extractPagination(response) {
    const totalPages = this.#parsePositiveInteger(response.headers.get('pages'), 1);
    const page = this.#clamp(this.#parsePositiveInteger(response.headers.get('page'), 1), 1, totalPages);
    const perPage = this.#parsePositiveInteger(response.headers.get('per_page'), 10);

    return { page, pages: totalPages, perPage };
  }

  #parsePositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed) || parsed < 1) {
      return fallback;
    }

    return parsed;
  }

  #clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
