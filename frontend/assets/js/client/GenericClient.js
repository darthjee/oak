import getHashQueryParams from '../utils/hashQueryParams.js';
import HashRouteResolver from '../utils/HashRouteResolver.js';

/**
 * A generic HTTP client that handles query param forwarding and pagination header reading.
 */
export default class GenericClient {
  /** @type {Function} */
  #hashProvider;
  /** @type {HashRouteResolver} */
  #routeResolver;

  /**
   * Creates a new GenericClient instance.
   *
   * @param {Function} [hashProvider] function returning the current location hash
   */
  constructor(hashProvider = () => (typeof window === 'undefined' ? '' : window.location.hash)) {
    this.#hashProvider = hashProvider;
    this.#routeResolver = new HashRouteResolver(hashProvider);
  }

  /**
   * Returns the current hash as provided by the configured hash provider.
   *
   * @returns {string} current location hash
   */
  currentHash() {
    return this.#hashProvider();
  }

  /**
   * Builds the full URL by appending hash query params to the given path.
   *
   * @param {string} path base path
   * @param {URLSearchParams} [params] query params to append
   * @returns {string} path with query params appended
   */
  #buildUrl(path, params = new URLSearchParams()) {
    const query = params.toString();
    return query ? `${path}?${query}` : path;
  }

  /**
   * Fetches the given path, forwarding hash query params, and returns the parsed JSON body.
   *
   * @param {string} path resource path
   * @returns {Promise<*>} parsed JSON response body
   * @throws {Error} if the response is not ok
   */
  async fetch(path) {
    return this.#request(this.#buildUrl(path, getHashQueryParams(this.currentHash())), {
      headers: { Accept: 'application/json' },
    });
  }

  /**
   * Sends a PATCH request with JSON payload and returns the parsed JSON body.
   *
   * @param {string} path resource path
   * @param {Object} body JSON payload body
   * @returns {Promise<*>} parsed JSON response body
   * @throws {Error} if the response is not ok
   */
  async patch(path, body) {
    return this.#request(path, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  /**
   * Fetches the given path, forwarding hash query params, and returns both the JSON body
   * and pagination info extracted from response headers.
   *
   * @param {string} path resource path
   * @returns {Promise<{data: *, pagination: {page: number, pages: number, perPage: number}}>} object containing the JSON body and pagination info
   * @throws {Error} if the response is not ok
   */
  async fetchIndex(path) {
    const response = await fetch(this.#buildUrl(path, this.#routeResolver.getPaginationParams()), {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Request failed for ${path}`);
    }

    const data = await response.json();
    const pagination = this.#extractPagination(response.headers);

    return { data, pagination };
  }

  /**
   * Extracts pagination information from response headers.
   *
   * @param {Headers} headers response headers
   * @returns {{page: number, pages: number, perPage: number}} pagination object
   */
  #extractPagination(headers) {
    const pages = this.#parsePositiveInteger(headers.get('pages'), 1);
    const page = this.#clamp(this.#parsePositiveInteger(headers.get('page'), 1), 1, pages);
    const perPage = this.#parsePositiveInteger(headers.get('per_page'), 10);

    return { page, pages, perPage };
  }

  /**
   * Parses a string as a positive integer, returning a fallback on failure.
   *
   * @param {string|null} value string to parse
   * @param {number} fallback value to use if parsing fails
   * @returns {number} parsed value or fallback
   */
  #parsePositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);

    return (Number.isNaN(parsed) || parsed < 1) ? fallback : parsed;
  }

  /**
   * Clamps a value between min and max (inclusive).
   *
   * @param {number} value value to clamp
   * @param {number} min minimum allowed value
   * @param {number} max maximum allowed value
   * @returns {number} clamped value
   */
  #clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Performs a request and returns the parsed JSON response body.
   *
   * @param {string} path request path
   * @param {Object} options fetch options
   * @returns {Promise<*>} parsed response body
   * @throws {Error} if the response is not ok
   */
  async #request(path, options) {
    const response = await fetch(path, options);

    if (!response.ok) {
      throw new Error(`Request failed for ${path}`);
    }

    return response.json();
  }
}
