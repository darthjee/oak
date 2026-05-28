import Route from './Route.js';

/**
 * Manages route registration and resolution.
 *
 * Maintains a class-level singleton registry that delegates to an instance.
 * Routes are registered with path patterns (supporting `:param` segments) and
 * associated page identifiers.
 */
export default class Router {
  /** @type {Router|null} */
  static #registry = null;

  /** @type {Array<Route>} */
  #routes = [];

  /**
   * Returns the singleton registry instance, creating it if necessary.
   *
   * @returns {Router} registry instance
   */
  static #getRegistry() {
    if (!Router.#registry) {
      Router.#registry = new Router();
    }
    return Router.#registry;
  }

  /**
   * Registers a route path pattern with a page name in the class-level registry.
   *
   * @param {string} path route path pattern (e.g. '/categories/:slug/items')
   * @param {string} page page identifier to associate with this route
   */
  static register(path, page) {
    Router.#getRegistry().register(path, page);
  }

  /**
   * Resolves a route path to a page identifier using the class-level registry.
   *
   * @param {string} route route path to resolve (without query string)
   * @returns {string} page identifier, or 'home' if no match is found
   */
  static resolve(route) {
    return Router.#getRegistry().resolve(route);
  }

  /**
   * Resets the class-level registry. Useful for testing.
   */
  static reset() {
    Router.#registry = null;
  }

  /**
   * Registers a route path pattern with a page name.
   *
   * @param {string} path route path pattern (e.g. '/categories/:slug/items')
   * @param {string} page page identifier to associate with this route
   */
  register(path, page) {
    this.#routes.push(new Route(path, page));
  }

  /**
   * Resolves a route path to a page identifier.
   *
   * @param {string} route route path to resolve (without query string)
   * @returns {string} page identifier, or 'home' if no match is found
   */
  resolve(route) {
    const match = this.#routes.find((r) => r.matches(route));
    return match ? match.page : 'home';
  }
}

