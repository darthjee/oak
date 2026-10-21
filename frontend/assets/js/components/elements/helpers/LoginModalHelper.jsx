import React from 'react';
import Modal from 'react-bootstrap/cjs/Modal.js';
import Alert from '../Alert.jsx';
import LabeledCheckbox from '../LabeledCheckbox.jsx';
import LabeledInput from '../LabeledInput.jsx';
import { MODE_DEVICE, MODE_PASSWORD } from '../../../utils/LoginModalEvents.js';

/**
 * Tab labels, by mode.
 *
 * @type {Array<{mode: string, label: string}>}
 */
export const TABS = Object.freeze([
  { mode: MODE_PASSWORD, label: 'Log in with password' },
  { mode: MODE_DEVICE, label: 'Authorize with logged device' },
]);

/**
 * Messages shown on each final device panel.
 *
 * @type {Object<string, string>}
 */
export const FINAL_MESSAGES = Object.freeze({
  denied: 'The authorization request was denied.',
  expired: 'The authorization request expired.',
  logged: 'This authorization was already used.',
  notFound: 'The authorization request no longer exists.',
});

/**
 * Renders the login modal shell, tabs, forms and device panels.
 */
export default class LoginModalHelper {
  /**
   * Renders the login modal.
   *
   * @param {boolean} show whether the modal is visible
   * @param {{login: string, password: string, keepSignedIn: boolean, incorrect: boolean,
   *   error: boolean, mode?: string, panel?: string, submitError?: (string|null),
   *   networkError?: boolean, countdown?: string}} state modal state
   * @param {{onClose: Function, onCancel: Function, onSubmit: Function, onLoginChange: Function,
   *   onPasswordChange: Function, onKeepSignedInChange: Function, onModeChange?: Function,
   *   onTryAgain?: Function, onDeviceSubmit?: Function}} handlers modal event handlers
   * @returns {JSX.Element} rendered login modal
   */
  static render(show, state, handlers) {
    return (
      <Modal show={show} onHide={handlers.onClose}>
        <Modal.Header closeButton>
          <Modal.Title>Login</Modal.Title>
        </Modal.Header>
        {LoginModalHelper.#renderContent(state, handlers)}
      </Modal>
    );
  }

  static #renderContent(state, handlers) {
    const panel = state.panel || 'form';

    if (panel === 'waiting') {
      return LoginModalHelper.#renderWaiting(state);
    }

    if (Object.hasOwn(FINAL_MESSAGES, panel)) {
      return LoginModalHelper.#renderFinal(panel, handlers);
    }

    return (
      <>
        {LoginModalHelper.#renderTabs(state, handlers)}
        {state.mode === MODE_DEVICE
          ? LoginModalHelper.#renderDeviceForm(state, handlers)
          : LoginModalHelper.#renderPasswordForm(state, handlers)}
      </>
    );
  }

  static #renderTabs(state, handlers) {
    const current = state.mode === MODE_DEVICE ? MODE_DEVICE : MODE_PASSWORD;

    return (
      <ul className='nav nav-tabs px-3 pt-3'>
        {TABS.map(({ mode, label }) => (
          <li className='nav-item' key={mode}>
            <button
              type='button'
              className={mode === current ? 'nav-link active' : 'nav-link'}
              aria-current={mode === current ? 'page' : undefined}
              onClick={() => handlers.onModeChange?.(mode)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  static #renderLoginField(state, handlers) {
    return (
      <LabeledInput
        id='login'
        label='Username'
        type='text'
        value={state.login}
        onChange={handlers.onLoginChange}
      />
    );
  }

  static #renderKeepSignedIn(state, handlers) {
    return (
      <LabeledCheckbox
        id='keepSignedIn'
        label='Keep me signed in'
        checked={state.keepSignedIn}
        onChange={handlers.onKeepSignedInChange}
      />
    );
  }

  static #renderFooter(handlers, submitLabel) {
    return (
      <Modal.Footer>
        <button className='btn btn-secondary' type='button' onClick={handlers.onCancel}>
          Cancel
        </button>
        <button className='btn btn-primary' type='submit'>
          {submitLabel}
        </button>
      </Modal.Footer>
    );
  }

  static #renderPasswordForm(state, handlers) {
    return (
      <form onSubmit={handlers.onSubmit}>
        <Modal.Body>
          {state.incorrect ? <Alert message='User name or password incorrect.' /> : null}
          {state.error ? <Alert message='An unexpected error occurred, please try again later.' /> : null}
          {LoginModalHelper.#renderLoginField(state, handlers)}
          <LabeledInput
            id='password'
            label='Password'
            type='password'
            value={state.password}
            onChange={handlers.onPasswordChange}
          />
          {LoginModalHelper.#renderKeepSignedIn(state, handlers)}
        </Modal.Body>
        {LoginModalHelper.#renderFooter(handlers, 'Login')}
      </form>
    );
  }

  static #renderDeviceForm(state, handlers) {
    return (
      <form onSubmit={handlers.onDeviceSubmit}>
        <Modal.Body>
          {state.submitError ? <Alert message={state.submitError} /> : null}
          <p className='text-muted'>
            Approve this login from another device where you are already logged in.
          </p>
          {LoginModalHelper.#renderLoginField(state, handlers)}
          {LoginModalHelper.#renderKeepSignedIn(state, handlers)}
        </Modal.Body>
        {LoginModalHelper.#renderFooter(handlers, 'Request authorization')}
      </form>
    );
  }

  static #renderWaiting(state) {
    return (
      <Modal.Body className='text-center'>
        {state.networkError
          ? <Alert variant='warning' message='Network error, retrying...' />
          : null}
        <div className='spinner-border mb-3' role='status' aria-hidden='true' />
        <p>Waiting for another device to approve this login.</p>
        <p className='fs-4 font-monospace login-modal-countdown'>{state.countdown || '00:00'}</p>
      </Modal.Body>
    );
  }

  static #renderFinal(panel, handlers) {
    return (
      <>
        <Modal.Body>
          <Alert variant={panel === 'denied' ? 'danger' : 'warning'} message={FINAL_MESSAGES[panel]} />
        </Modal.Body>
        <Modal.Footer>
          <button className='btn btn-primary' type='button' onClick={handlers.onTryAgain}>
            Try again
          </button>
        </Modal.Footer>
      </>
    );
  }
}
