let _loggedIn = false;
const _listeners = new Set();

export const setLoggedIn = (value) => {
  const next = Boolean(value);

  if (next === _loggedIn) {
    return;
  }

  _loggedIn = next;
  _listeners.forEach((listener) => listener(_loggedIn));
};

export const isLoggedIn = () => _loggedIn;

/**
 * Registers a callback to be notified whenever the login state changes.
 *
 * @param {Function} listener called with the new boolean login state
 * @returns {Function} unsubscribe function
 */
export const subscribe = (listener) => {
  _listeners.add(listener);

  return () => {
    _listeners.delete(listener);
  };
};
