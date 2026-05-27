import AppHelper from './helpers/AppHelper.jsx';
import HashRouteResolver from './helpers/HashRouteResolver.js';

/**
 * Controls page routing based on the URL hash.
 */
export default class AppController {
  /**
   * Creates a new AppController instance.
   *
   * @param {Function|null} setPage state setter for updating the current page
   * @param {EventTarget} [eventTarget=window] target used to listen for hash change events
   * @param {Function} [locationProvider] function returning the current location hash
   */
  constructor(setPage, eventTarget = window, locationProvider = () => window.location.hash) {
    this.setPage = setPage;
    this.eventTarget = eventTarget;
    this.routeResolver = new HashRouteResolver(locationProvider);
  }

  /**
   * Returns the page identifier matching the current URL hash.
   *
   * @returns {string} page identifier, e.g. `'categories'` or `'home'`
   */
  getPage() {
    return this.routeResolver.getPage();
  }

  /**
   * Renders the component for the given page identifier.
   *
   * @param {string} page page identifier to render
   * @returns {JSX.Element} rendered page element
   */
  renderPage(page) {
    return AppHelper.render(page);
  }

  /**
   * Builds the React effect that listens for hash changes and updates the page state.
   *
   * @returns {Function} effect function that registers the hash change listener and returns a cleanup function
   */
  buildEffect() {
    return () => {
      const handleHashChange = () => this.setPage(this.getPage());

      this.eventTarget.addEventListener('hashchange', handleHashChange);

      return () => this.eventTarget.removeEventListener('hashchange', handleHashChange);
    };
  }
}
