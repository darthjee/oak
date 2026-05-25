import React from 'react';
import Modal from 'react-bootstrap/cjs/Modal.js';

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
            {state.incorrect ? (
              <div className='alert alert-danger' role='alert'>
                User name or password incorrect.
              </div>
            ) : null}
            {state.error ? (
              <div className='alert alert-danger' role='alert'>
                An unexpected error occurred, please try again later.
              </div>
            ) : null}
            <div className='mb-3'>
              <label className='form-label' htmlFor='login'>
                Username
              </label>
              <input
                className='form-control'
                id='login'
                type='text'
                value={state.login}
                onChange={handlers.onLoginChange}
              />
            </div>
            <div className='mb-3'>
              <label className='form-label' htmlFor='password'>
                Password
              </label>
              <input
                className='form-control'
                id='password'
                type='password'
                value={state.password}
                onChange={handlers.onPasswordChange}
              />
            </div>
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
