export default class HeaderClient {
  checkLogin() {
    return fetch('/users/login.json', {
      headers: { Accept: 'application/json' },
    });
  }

  fetchCategories() {
    return fetch('/user/categories.json', {
      headers: { Accept: 'application/json' },
    });
  }

  logoff() {
    return fetch('/users/logoff', {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
  }
}
