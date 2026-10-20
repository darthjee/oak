import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LoginModal from '../../../assets/js/components/elements/LoginModal.jsx';
import LoginModalController from '../../../assets/js/components/elements/controllers/LoginModalController.js';
import LoginModalHelper from '../../../assets/js/components/elements/helpers/LoginModalHelper.jsx';

describe('LoginModal', function() {
  const renderModal = () => renderToStaticMarkup(
    React.createElement(LoginModal, {
      show: true,
      onClose: jasmine.createSpy('onClose'),
      onSuccess: jasmine.createSpy('onSuccess'),
    })
  );

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
      },
      jasmine.objectContaining({
        onClose: jasmine.any(Function),
        onCancel: jasmine.any(Function),
        onSubmit: jasmine.any(Function),
        onLoginChange: jasmine.any(Function),
        onPasswordChange: jasmine.any(Function),
        onKeepSignedInChange: jasmine.any(Function),
      })
    );
  });

  it('submits with the keep me signed in value', function() {
    spyOn(LoginModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());

    renderModal();

    const handlers = LoginModalHelper.render.calls.mostRecent().args[2];
    const event = { preventDefault: jasmine.createSpy('preventDefault') };

    handlers.onSubmit(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(LoginModalController.prototype.handleSubmit).toHaveBeenCalledWith('', '', false);
  });
});
