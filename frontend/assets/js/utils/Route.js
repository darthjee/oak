/**
 * Represents a single registered route, encapsulating the compiled regex and
 * the associated page identifier.
 */
export default class Route {
  /** @type {RegExp} */
  #regex;

  /** @type {Array<string>} */
  #paramNames;

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
    this.#paramNames = [];
    const pattern = path.replace(/:([^/]+)/g, (_, name) => {
      this.#paramNames.push(name);
      return '([^/]+)';
    });
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
   * Extracts params from a route path.
   *
   * @param {string} route route path to parse (without query string)
   * @returns {Object<string, string>} extracted params or empty object when unmatched
   */
  params(route) {
    const match = route.match(this.#regex);

    if (!match) {
      return {};
    }

    return this.#paramNames.reduce((acc, name, index) => {
      acc[name] = match[index + 1] || '';
      return acc;
    }, {});
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
