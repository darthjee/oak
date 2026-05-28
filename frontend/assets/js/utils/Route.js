/**
 * Represents a single registered route, encapsulating the compiled regex and
 * the associated page identifier.
 */
export default class Route {
  /** @type {RegExp} */
  #regex;

  /** @type {string} */
  #page;

  /**
   * Creates a new Route from a path pattern and a page identifier.
   *
   * `:param` segments in the pattern are compiled to `[^/]+` regex fragments.
   * A trailing slash is always optional in the compiled pattern.
   *
   * @param {string} path path pattern (e.g. '/categories/:slug/items')
   * @param {string} page page identifier to associate with this route
   */
  constructor(path, page) {
    const pattern = path.replace(/:([^/]+)/g, '[^/]+');
    this.#regex = new RegExp(`^${pattern}/?$`);
    this.#page = page;
  }

  /**
   * Tests whether this route matches the given path.
   *
   * @param {string} route route path to test (without query string)
   * @returns {boolean} true if this route matches
   */
  matches(route) {
    return this.#regex.test(route);
  }

  /**
   * Returns the page identifier for this route.
   *
   * @returns {string} page identifier
   */
  get page() {
    return this.#page;
  }
}
