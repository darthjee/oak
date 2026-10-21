import LoginModalHelper, { FINAL_MESSAGES } from '../../../../assets/js/components/elements/helpers/LoginModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';
import Alert from '../../../../assets/js/components/elements/Alert.jsx';
import LabeledCheckbox from '../../../../assets/js/components/elements/LabeledCheckbox.jsx';
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
    onKeepSignedInChange: jasmine.createSpy('onKeepSignedInChange'),
    onModeChange: jasmine.createSpy('onModeChange'),
    onTryAgain: jasmine.createSpy('onTryAgain'),
    onDeviceSubmit: jasmine.createSpy('onDeviceSubmit'),
  });

  it('renders the login fields and buttons', function() {
    const element = LoginModalHelper.render(true, {
      login: '',
      password: '',
      keepSignedIn: false,
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
        keepSignedIn: false,
        incorrect: true,
        error: false,
      }, buildHandlers())
    );
    const errorElement = (
      LoginModalHelper.render(true, {
        login: '',
        password: '',
        keepSignedIn: false,
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
      keepSignedIn: false,
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

  const findCheckbox = (element) => findElement(
    element,
    (child) => child.type === LabeledCheckbox && child.props.id === 'keepSignedIn'
  );

  it('renders the keep me signed in checkbox unchecked by default', function() {
    const element = LoginModalHelper.render(true, {
      login: '',
      password: '',
      keepSignedIn: false,
      incorrect: false,
      error: false,
    }, buildHandlers());
    const checkbox = findCheckbox(element);

    expect(checkbox).not.toBeNull();
    expect(checkbox.props.label).toBe('Keep me signed in');
    expect(checkbox.props.checked).toBe(false);
  });

  it('reflects the keep me signed in state', function() {
    const element = LoginModalHelper.render(true, {
      login: '',
      password: '',
      keepSignedIn: true,
      incorrect: false,
      error: false,
    }, buildHandlers());

    expect(findCheckbox(element).props.checked).toBe(true);
  });

  it('wires the keep me signed in change handler', function() {
    const handlers = buildHandlers();
    const element = LoginModalHelper.render(true, {
      login: '',
      password: '',
      keepSignedIn: false,
      incorrect: false,
      error: false,
    }, handlers);
    const event = { target: { checked: true } };

    findCheckbox(element).props.onChange(event);

    expect(handlers.onKeepSignedInChange).toHaveBeenCalledWith(event);
  });

  const buildState = (overrides = {}) => ({
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
    ...overrides,
  });

  const textOf = (node) => {
    if (node === null || node === undefined || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(textOf).join('');

    const props = node.props || {};
    const own = props.message ? String(props.message) : '';

    return own + textOf(props.children);
  };

  const findButton = (element, label) => findElement(
    element,
    (child) => child.type === 'button' && child.props.children === label
  );

  describe('tabs', function() {
    it('renders both tabs with password active by default', function() {
      const element = LoginModalHelper.render(true, buildState(), buildHandlers());
      const passwordTab = findButton(element, 'Log in with password');
      const deviceTab = findButton(element, 'Authorize with logged device');

      expect(passwordTab.props.className).toContain('active');
      expect(deviceTab.props.className).not.toContain('active');
    });

    it('marks the device tab active in device mode', function() {
      const element = LoginModalHelper.render(true, buildState({ mode: 'device' }), buildHandlers());

      expect(findButton(element, 'Authorize with logged device').props.className).toContain('active');
      expect(findButton(element, 'Log in with password').props.className).not.toContain('active');
    });

    it('calls onModeChange with the clicked mode', function() {
      const handlers = buildHandlers();
      const element = LoginModalHelper.render(true, buildState(), handlers);

      findButton(element, 'Authorize with logged device').props.onClick();
      findButton(element, 'Log in with password').props.onClick();

      expect(handlers.onModeChange.calls.allArgs()).toEqual([['device'], ['password']]);
    });

    it('renders tabs when state has no mode or panel', function() {
      const element = LoginModalHelper.render(true, {
        login: '', password: '', keepSignedIn: false, incorrect: false, error: false,
      }, buildHandlers());

      expect(findButton(element, 'Log in with password').props.className).toContain('active');
    });
  });

  describe('device form', function() {
    const renderDevice = (overrides = {}, handlers = buildHandlers()) => LoginModalHelper.render(
      true, buildState({ mode: 'device', ...overrides }), handlers
    );

    it('renders login and keep signed in, without password', function() {
      const element = renderDevice({ login: 'oak-user', keepSignedIn: true });
      const loginField = findElement(
        element,
        (child) => child.type === LabeledInput && child.props.id === 'login'
      );
      const passwordField = findElement(
        element,
        (child) => child.type === LabeledInput && child.props.id === 'password'
      );

      expect(loginField.props.value).toBe('oak-user');
      expect(passwordField).toBeNull();
      expect(findCheckbox(element).props.checked).toBe(true);
    });

    it('wires the device submit, cancel and field handlers', function() {
      const handlers = buildHandlers();
      const element = renderDevice({}, handlers);
      const form = findElement(element, (child) => child.type === 'form');
      const loginField = findElement(
        element,
        (child) => child.type === LabeledInput && child.props.id === 'login'
      );
      const event = { preventDefault: jasmine.createSpy('preventDefault') };

      form.props.onSubmit(event);
      findButton(element, 'Cancel').props.onClick();
      loginField.props.onChange({ target: { value: 'x' } });
      findCheckbox(element).props.onChange({ target: { checked: true } });

      expect(handlers.onDeviceSubmit).toHaveBeenCalledWith(event);
      expect(handlers.onSubmit).not.toHaveBeenCalled();
      expect(handlers.onCancel).toHaveBeenCalled();
      expect(handlers.onLoginChange).toHaveBeenCalled();
      expect(handlers.onKeepSignedInChange).toHaveBeenCalled();
    });

    it('renders a submit button', function() {
      const element = renderDevice();
      const submit = findElement(
        element,
        (child) => child.type === 'button' && child.props.type === 'submit'
      );

      expect(submit).not.toBeNull();
    });

    it('renders the submit error', function() {
      const element = renderDevice({ submitError: 'Too many requests' });
      const alert = findElement(element, (child) => child.type === Alert);

      expect(alert.props.message).toBe('Too many requests');
    });

    it('renders no alert without a submit error', function() {
      const element = renderDevice();

      expect(findElement(element, (child) => child.type === Alert)).toBeNull();
    });
  });

  describe('waiting panel', function() {
    it('renders the spinner, message and countdown without tabs or form', function() {
      const element = LoginModalHelper.render(
        true, buildState({ mode: 'device', panel: 'waiting', countdown: '04:05' }), buildHandlers()
      );
      const spinner = findElement(
        element,
        (child) => typeof child.props?.className === 'string' && child.props.className.includes('spinner-border')
      );

      expect(spinner).not.toBeNull();
      expect(textOf(element)).toContain('Waiting for another device to approve');
      expect(textOf(element)).toContain('04:05');
      expect(findElement(element, (child) => child.type === 'form')).toBeNull();
      expect(findButton(element, 'Authorize with logged device')).toBeNull();
      expect(findButton(element, 'Cancel')).toBeNull();
      expect(findElement(element, (child) => child.type === Alert)).toBeNull();
    });

    it('renders the network error alert', function() {
      const element = LoginModalHelper.render(
        true, buildState({ mode: 'device', panel: 'waiting', networkError: true }), buildHandlers()
      );
      const alert = findElement(element, (child) => child.type === Alert);

      expect(alert.props.message).toBe('Network error, retrying...');
    });

    it('keeps the modal close handler', function() {
      const handlers = buildHandlers();
      const element = LoginModalHelper.render(
        true, buildState({ mode: 'device', panel: 'waiting' }), handlers
      );

      findElement(element, (child) => child.type === Modal).props.onHide();

      expect(handlers.onClose).toHaveBeenCalled();
    });
  });

  describe('final panels', function() {
    ['denied', 'expired', 'logged', 'notFound'].forEach((panel) => {
      it(`renders the ${panel} message and a try again button`, function() {
        const handlers = buildHandlers();
        const element = LoginModalHelper.render(
          true, buildState({ mode: 'device', panel }), handlers
        );
        const alert = findElement(element, (child) => child.type === Alert);

        expect(alert.props.message).toBe(FINAL_MESSAGES[panel]);
        expect(findElement(element, (child) => child.type === 'form')).toBeNull();
        expect(findButton(element, 'Log in with password')).toBeNull();

        findButton(element, 'Try again').props.onClick();

        expect(handlers.onTryAgain).toHaveBeenCalled();
      });
    });
  });
});
