/**
 * Resolves routing information from the current hash URL.
 */
export default class HashRouteResolver {
  /** @type {Function} */
  #hashProvider;

  /**
   * Creates a new resolver instance.
   *
   * @param {Function} [hashProvider] function returning current hash URL
   */
  constructor(hashProvider = () => (typeof window === 'undefined' ? '' : window.location.hash)) {
    this.#hashProvider = hashProvider;
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
   * @returns {string} page identifier
   */
  getPage() {
    const hash = this.currentHash();

    if (/^#\/categories\/[^/]+\/items\/[^/]+\/?(\?.*)?$/.test(hash)) {
      return 'categoryItem';
    }

    if (/^#\/categories\/[^/]+\/items\/?(\?.*)?$/.test(hash)) {
      return 'categoryItems';
    }

    if (/^#\/categories\/?(\?.*)?$/.test(hash)) {
      return 'categories';
    }

    if (/^#\/kinds\/?(\?.*)?$/.test(hash)) {
      return 'kinds';
    }

    return 'home';
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
