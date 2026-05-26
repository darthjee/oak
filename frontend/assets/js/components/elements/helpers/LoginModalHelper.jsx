import React from 'react';
import Modal from 'react-bootstrap/cjs/Modal.js';
import Alert from '../Alert.jsx';
import LabeledInput from '../LabeledInput.jsx';

/**
 * Renders the login modal shell and form elements.
 */
export default class LoginModalHelper {
  /**
   * Renders the login modal.
   *
   * @param {boolean} show whether the modal is visible
   * @param {{login: string, password: string, incorrect: boolean, error: boolean}} state modal state
   * @param {{onClose: Function, onCancel: Function, onSubmit: Function, onLoginChange: Function, onPasswordChange: Function}} handlers modal event handlers
   * @returns {JSX.Element} rendered login modal
   */
  static render(show, state, handlers) {
    return (
      <Modal show={show} onHide={handlers.onClose}>
        <form onSubmit={handlers.onSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>Login</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {state.incorrect ? <Alert message='User name or password incorrect.' /> : null}
            {state.error ? <Alert message='An unexpected error occurred, please try again later.' /> : null}
            <LabeledInput
              id='login'
              label='Username'
              type='text'
              value={state.login}
              onChange={handlers.onLoginChange}
            />
            <LabeledInput
              id='password'
              label='Password'
              type='password'
              value={state.password}
              onChange={handlers.onPasswordChange}
            />
          </Modal.Body>
          <Modal.Footer>
            <button className='btn btn-secondary' type='button' onClick={handlers.onCancel}>
              Cancel
            </button>
            <button className='btn btn-primary' type='submit'>
              Login
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  }
}
