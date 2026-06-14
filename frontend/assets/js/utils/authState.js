let _loggedIn = false;

export const setLoggedIn = (value) => {
  _loggedIn = Boolean(value);
};

export const isLoggedIn = () => _loggedIn;
