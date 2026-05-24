import AppHelper from './helpers/AppHelper.js';

export default class AppController {
  constructor(setPage, eventTarget = window, locationProvider = () => window.location.hash) {
    this.setPage = setPage;
    this.eventTarget = eventTarget;
    this.locationProvider = locationProvider;
  }

  getPage() {
    const hash = this.locationProvider();

    if (hash === '#/categories' || hash === '#/categories/') {
      return 'categories';
    }

    return 'home';
  }

  renderPage(page) {
    return AppHelper.render(page);
  }

  buildEffect() {
    return () => {
      const handleHashChange = () => this.setPage(this.getPage());

      this.eventTarget.addEventListener('hashchange', handleHashChange);

      return () => this.eventTarget.removeEventListener('hashchange', handleHashChange);
    };
  }
}
