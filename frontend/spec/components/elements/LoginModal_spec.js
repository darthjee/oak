import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LoginModal from '../../../assets/js/components/elements/LoginModal.jsx';
import LoginModalController from '../../../assets/js/components/elements/controllers/LoginModalController.js';
import LoginModalHelper from '../../../assets/js/components/elements/helpers/LoginModalHelper.jsx';

describe('LoginModal', function() {
  const renderModal = (props = {}) => renderToStaticMarkup(
    React.createElement(LoginModal, {
      show: true,
      onClose: jasmine.createSpy('onClose'),
      onSuccess: jasmine.createSpy('onSuccess'),
      ...props,
    })
  );

  const lastState = () => LoginModalHelper.render.calls.mostRecent().args[1];
  const lastHandlers = () => LoginModalHelper.render.calls.mostRecent().args[2];

  beforeEach(function() {
    spyOn(LoginModalHelper, 'render').and.returnValue(React.createElement('div', null, 'modal'));
  });

  it('passes the default state to the helper', function() {
    const html = renderModal();

    expect(html).toContain('modal');
    expect(LoginModalHelper.render).toHaveBeenCalledWith(
      true,
      {
        login: '',
        password: '',
        keepSignedIn: false,
        incorrect: false,
        error: false,
        mode: 'password',
        panel: 'form',
        submitError: null,
        networkError: false,
        countdown: '00:00',
      },
      jasmine.objectContaining({
        onClose: jasmine.any(Function),
        onCancel: jasmine.any(Function),
        onSubmit: jasmine.any(Function),
        onDeviceSubmit: jasmine.any(Function),
        onModeChange: jasmine.any(Function),
        onTryAgain: jasmine.any(Function),
        onLoginChange: jasmine.any(Function),
        onPasswordChange: jasmine.any(Function),
        onKeepSignedInChange: jasmine.any(Function),
      })
    );
  });

  it('starts in device mode when the mode prop is device', function() {
    renderModal({ mode: 'device' });

    expect(lastState().mode).toBe('device');
  });

  it('falls back to password mode for unknown modes', function() {
    renderModal({ mode: 'register' });

    expect(lastState().mode).toBe('password');
  });

  it('passes the show flag to the helper', function() {
    renderModal({ show: false });

    expect(LoginModalHelper.render.calls.mostRecent().args[0]).toBeFalse();
  });

  it('submits with the keep me signed in value', function() {
    spyOn(LoginModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());

    renderModal();

    const event = { preventDefault: jasmine.createSpy('preventDefault') };

    lastHandlers().onSubmit(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(LoginModalController.prototype.handleSubmit).toHaveBeenCalledWith('', '', false);
  });

  it('submits the device form through handleDeviceSubmit', function() {
    spyOn(LoginModalController.prototype, 'handleDeviceSubmit').and.returnValue(Promise.resolve());

    renderModal({ mode: 'device' });

    const event = { preventDefault: jasmine.createSpy('preventDefault') };

    lastHandlers().onDeviceSubmit(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(LoginModalController.prototype.handleDeviceSubmit).toHaveBeenCalledWith('', false);
  });

  it('switches mode through the controller on tab change', function() {
    spyOn(LoginModalController.prototype, 'switchMode');

    renderModal();
    lastHandlers().onModeChange('device');

    expect(LoginModalController.prototype.switchMode).toHaveBeenCalledWith('device');
  });

  it('switches to device mode on try again', function() {
    spyOn(LoginModalController.prototype, 'switchMode');

    renderModal({ mode: 'device' });
    lastHandlers().onTryAgain();

    expect(LoginModalController.prototype.switchMode).toHaveBeenCalledWith('device');
  });

  it('clears the controller and calls onClose on close', function() {
    spyOn(LoginModalController.prototype, 'handleClear');
    const onClose = jasmine.createSpy('onClose');

    renderModal({ onClose });
    lastHandlers().onClose();

    expect(LoginModalController.prototype.handleClear).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('clears the controller on cancel', function() {
    spyOn(LoginModalController.prototype, 'handleClear');

    renderModal();
    lastHandlers().onCancel();

    expect(LoginModalController.prototype.handleClear).toHaveBeenCalled();
  });

  it('forwards the latest onSuccess to the controller', function() {
    spyOn(LoginModalController.prototype, 'setOnSuccess');
    const onSuccess = jasmine.createSpy('onSuccess');

    renderModal({ onSuccess });

    expect(LoginModalController.prototype.setOnSuccess).toHaveBeenCalledWith(onSuccess);
  });
});
