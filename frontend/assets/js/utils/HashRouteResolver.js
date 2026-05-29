import Router from './Router.js';

/**
 * Resolves routing information from the current hash URL.
 */
export default class HashRouteResolver {
  /** @type {Function} */
  #hashProvider;

  /** @type {Router} */
  #router;

  /**
   * Builds the Router instance with all known application routes registered.
   *
   * @returns {Router} configured router
   */
  static #buildRouter() {
    const router = new Router();
    router.register('/categories/:slug/items/:id/edit', 'categoryItemEdit');
    router.register('/categories/:slug/items/new', 'categoryItemNew');
    router.register('/categories/:slug/items/:id', 'categoryItem');
    router.register('/categories/:slug/items', 'categoryItems');
    router.register('/categories/:slug/edit', 'categoryEdit');
    router.register('/categories/new', 'categoryNew');
    router.register('/categories/:slug', 'category');
    router.register('/categories', 'categories');
    router.register('/kinds', 'kinds');
    return router;
  }

  /**
   * Creates a new resolver instance.
   *
   * @param {Function} [hashProvider] function returning current hash URL
   */
  constructor(hashProvider = () => (typeof window === 'undefined' ? '' : window.location.hash)) {
    this.#hashProvider = hashProvider;
    this.#router = HashRouteResolver.#buildRouter();
  }

  /**
   * Reads the current hash URL.
   *
   * @returns {string} current hash URL
   */
  currentHash() {
    return this.#hashProvider();
  }

  /**
   * Resolves the current page identifier from the hash route.
   *
   * Query parameters are stripped before matching so that hashes like
   * `#/categories?page=2` correctly resolve to `'categories'`.
   *
   * @returns {string} page identifier
   */
  getPage() {
    const hash = this.currentHash();
    const withoutHash = hash.startsWith('#') ? hash.slice(1) : hash;
    const route = withoutHash.split('?')[0];
    return this.#router.resolve(route);
  }

  /**
   * Extracts pagination query params from the current hash URL.
   *
   * @returns {URLSearchParams} params containing only `page` and `per_page`
   */
  getPaginationParams() {
    const questionMarkIndex = this.currentHash().indexOf('?');

    if (questionMarkIndex === -1) {
      return new URLSearchParams();
    }

    const query = new URLSearchParams(this.currentHash().slice(questionMarkIndex + 1));
    const params = new URLSearchParams();
    const page = query.get('page');
    const perPage = query.get('per_page');

    if (page !== null) {
      params.set('page', page);
    }

    if (perPage !== null) {
      params.set('per_page', perPage);
    }

    return params;
  }
}
