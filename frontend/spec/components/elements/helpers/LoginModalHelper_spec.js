import LoginModalHelper from '../../../../assets/js/components/elements/helpers/LoginModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';
import Alert from '../../../../assets/js/components/elements/Alert.jsx';
import LabeledInput from '../../../../assets/js/components/elements/LabeledInput.jsx';

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
    const loginField = findElement(
      element,
      (child) => child.type === LabeledInput && child.props.id === 'login'
    );
    const passwordField = findElement(
      element,
      (child) => child.type === LabeledInput && child.props.id === 'password'
    );
    const cancelButton = findElement(
      element,
      (child) => child.type === 'button' && child.props.children === 'Cancel'
    );

    expect(loginField.props.label).toBe('Username');
    expect(loginField.props.type).toBe('text');
    expect(passwordField.props.label).toBe('Password');
    expect(passwordField.props.type).toBe('password');
    expect(cancelButton).not.toBeNull();
  });

  it('renders the expected error messages', function() {
    const incorrectElement = (
      LoginModalHelper.render(true, {
        login: '',
        password: '',
        incorrect: true,
        error: false,
      }, buildHandlers())
    );
    const errorElement = (
      LoginModalHelper.render(true, {
        login: '',
        password: '',
        incorrect: false,
        error: true,
      }, buildHandlers())
    );
    const incorrectAlert = findElement(
      incorrectElement,
      (child) => child.type === Alert
    );
    const errorAlert = findElement(
      errorElement,
      (child) => child.type === Alert
    );

    expect(incorrectAlert.props.message).toBe('User name or password incorrect.');
    expect(errorAlert.props.message).toBe('An unexpected error occurred, please try again later.');
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
