import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LoginModal from '../../../assets/js/components/elements/LoginModal.jsx';
import LoginModalHelper from '../../../assets/js/components/elements/helpers/LoginModalHelper.jsx';

describe('LoginModal', function() {
  it('passes the default state to the helper', function() {
    spyOn(LoginModalHelper, 'render').and.returnValue(React.createElement('div', null, 'modal'));

    const html = renderToStaticMarkup(
      React.createElement(LoginModal, {
        show: true,
        onClose: jasmine.createSpy('onClose'),
        onSuccess: jasmine.createSpy('onSuccess'),
      })
    );

    expect(html).toContain('modal');
    expect(LoginModalHelper.render).toHaveBeenCalledWith(
      true,
      {
        login: '',
        password: '',
        incorrect: false,
        error: false,
      },
      jasmine.objectContaining({
        onClose: jasmine.any(Function),
        onCancel: jasmine.any(Function),
        onSubmit: jasmine.any(Function),
        onLoginChange: jasmine.any(Function),
        onPasswordChange: jasmine.any(Function),
      })
    );
  });
});
