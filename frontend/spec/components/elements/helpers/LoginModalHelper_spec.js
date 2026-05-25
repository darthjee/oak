import LoginModalHelper from '../../../../assets/js/components/elements/helpers/LoginModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

const collectText = (node) => {
  if (!node) {
    return '';
  }

  if (Array.isArray(node)) {
    return node.map((child) => collectText(child)).join(' ');
  }

  if (typeof node === 'string') {
    return node;
  }

  if (typeof node !== 'object') {
    return '';
  }

  return collectText(node.props?.children);
};

describe('LoginModalHelper', function() {
  const buildHandlers = () => ({
    onClose: jasmine.createSpy('onClose'),
    onCancel: jasmine.createSpy('onCancel'),
    onSubmit: jasmine.createSpy('onSubmit'),
    onLoginChange: jasmine.createSpy('onLoginChange'),
    onPasswordChange: jasmine.createSpy('onPasswordChange'),
  });

  it('renders the login fields and buttons', function() {
    const element = LoginModalHelper.render(true, {
      login: '',
      password: '',
      incorrect: false,
      error: false,
    }, buildHandlers());
    const text = collectText(element);
    const loginField = findElement(
      element,
      (child) => child.type === 'input' && child.props.id === 'login'
    );
    const passwordField = findElement(
      element,
      (child) => child.type === 'input' && child.props.id === 'password'
    );

    expect(text).toContain('Login');
    expect(text).toContain('Username');
    expect(text).toContain('Password');
    expect(text).toContain('Cancel');
    expect(loginField.props.type).toBe('text');
    expect(passwordField.props.type).toBe('password');
  });

  it('renders the expected error messages', function() {
    const incorrectText = collectText(
      LoginModalHelper.render(true, {
        login: '',
        password: '',
        incorrect: true,
        error: false,
      }, buildHandlers())
    );
    const errorText = collectText(
      LoginModalHelper.render(true, {
        login: '',
        password: '',
        incorrect: false,
        error: true,
      }, buildHandlers())
    );

    expect(incorrectText).toContain('User name or password incorrect.');
    expect(errorText).toContain('An unexpected error occurred, please try again later.');
  });

  it('wires modal close, cancel, and submit handlers', function() {
    const handlers = buildHandlers();
    const element = LoginModalHelper.render(true, {
      login: '',
      password: '',
      incorrect: false,
      error: false,
    }, handlers);
    const modal = findElement(element, (child) => child.type === Modal);
    const cancelButton = findElement(
      element,
      (child) => child.type === 'button' && child.props.children === 'Cancel'
    );
    const form = findElement(element, (child) => child.type === 'form');
    const submitEvent = { preventDefault: jasmine.createSpy('preventDefault') };

    modal.props.onHide();
    cancelButton.props.onClick();
    form.props.onSubmit(submitEvent);

    expect(handlers.onClose).toHaveBeenCalled();
    expect(handlers.onCancel).toHaveBeenCalled();
    expect(handlers.onSubmit).toHaveBeenCalledWith(submitEvent);
  });
});
