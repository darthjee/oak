import LoginModalHelper, { FINAL_MESSAGES } from '../../../../assets/js/components/elements/helpers/LoginModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';
import Alert from '../../../../assets/js/components/elements/Alert.jsx';
import LabeledCheckbox from '../../../../assets/js/components/elements/LabeledCheckbox.jsx';
import LabeledInput from '../../../../assets/js/components/elements/LabeledInput.jsx';
import { findButton, findElement, textOf } from '../../../support/elementFinder.js';

describe('LoginModalHelper device mode', function() {
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

  const findCheckbox = (element) => findElement(
    element,
    (child) => child.type === LabeledCheckbox && child.props.id === 'keepSignedIn'
  );

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
