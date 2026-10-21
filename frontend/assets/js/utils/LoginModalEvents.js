/**
 * Name of the `window` event used to open or close the login modal.
 *
 * @type {string}
 */
export const LOGIN_MODAL_EVENT = 'oak:login-modal';

/**
 * Login modal mode for username/password login.
 *
 * @type {string}
 */
export const MODE_PASSWORD = 'password';

/**
 * Login modal mode for device authorization login.
 *
 * @type {string}
 */
export const MODE_DEVICE = 'device';

/**
 * Modes accepted by the login modal.
 *
 * @type {Array<string>}
 */
export const LOGIN_MODAL_MODES = Object.freeze([MODE_PASSWORD, MODE_DEVICE]);

const hasWindow = () => typeof window !== 'undefined' && window !== null;

const normalizeMode = (mode) => (
  LOGIN_MODAL_MODES.includes(mode) ? mode : MODE_PASSWORD
);

const dispatch = (detail) => {
  if (!hasWindow()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(LOGIN_MODAL_EVENT, { detail }));
};

/**
 * Requests the login modal to open in the given mode.
 *
 * @param {string} [mode='password'] modal mode (`'password'` or `'device'`); unknown
 *   values fall back to `'password'`
 * @returns {void}
 */
export const open = (mode = MODE_PASSWORD) => {
  dispatch({ open: true, mode: normalizeMode(mode) });
};

/**
 * Requests the login modal to close.
 *
 * @returns {void}
 */
export const close = () => {
  dispatch({ open: false, mode: MODE_PASSWORD });
};

/**
 * Registers a callback to be notified of every login modal event.
 *
 * @param {Function} listener called with the event detail `{ open, mode }`
 * @returns {Function} unsubscribe function
 */
export const subscribe = (listener) => {
  if (!hasWindow()) {
    return () => {};
  }

  const handler = (event) => listener(event.detail);

  window.addEventListener(LOGIN_MODAL_EVENT, handler);

  return () => {
    window.removeEventListener(LOGIN_MODAL_EVENT, handler);
  };
};

const LoginModalEvents = { open, close, subscribe };

export default LoginModalEvents;
