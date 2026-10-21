import { useEffect, useMemo, useState } from 'react';
import LoginModalController from './controllers/LoginModalController.js';
import LoginModalHelper from './helpers/LoginModalHelper.jsx';
import { LOGIN_MODAL_MODES, MODE_DEVICE, MODE_PASSWORD } from '../../utils/LoginModalEvents.js';
import { useCountdown } from '../../utils/countdown.js';

const normalizeMode = (mode) => (LOGIN_MODAL_MODES.includes(mode) ? mode : MODE_PASSWORD);

const preventDefault = (event) => {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
};

/**
 * Stops the controller's poller when the page or tab unloads, and on unmount.
 *
 * @param {LoginModalController} controller modal controller
 * @returns {void}
 */
const usePollerCleanup = (controller) => {
  useEffect(() => {
    const stop = () => controller.stop();
    const hasWindow = typeof window !== 'undefined' && window !== null;

    if (hasWindow) {
      window.addEventListener('pagehide', stop);
    }

    return () => {
      if (hasWindow) {
        window.removeEventListener('pagehide', stop);
      }

      stop();
    };
  }, [controller]);
};

/**
 * Stateful login modal component with password and device authorization modes.
 *
 * @param {{show: boolean, onClose: Function, onSuccess: Function, mode?: string}} props
 *   component props
 * @returns {JSX.Element} rendered login modal
 */
export default function LoginModal({ show, onClose, onSuccess, mode: modeProp }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [incorrect, setIncorrect] = useState(false);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState(() => normalizeMode(modeProp));
  const [panel, setPanel] = useState('form');
  const [submitError, setSubmitError] = useState(null);
  const [networkError, setNetworkError] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const countdown = useCountdown(expiresAt);

  const controller = useMemo(() => new LoginModalController({
    setLogin,
    setPassword,
    setKeepSignedIn,
    setIncorrect,
    setError,
    setMode,
    setPanel,
    setSubmitError,
    setNetworkError,
    setExpiresAt,
  }), []);

  controller.setOnSuccess(onSuccess);

  useEffect(() => {
    if (show) {
      controller.switchMode(modeProp);
    } else {
      controller.handleClear();
    }
  }, [controller, show, modeProp]);

  usePollerCleanup(controller);

  const handleClose = () => {
    controller.handleClear();

    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleSubmit = (event) => {
    preventDefault(event);

    return controller.handleSubmit(login, password, keepSignedIn);
  };

  const handleDeviceSubmit = (event) => {
    preventDefault(event);

    return controller.handleDeviceSubmit(login, keepSignedIn);
  };

  return LoginModalHelper.render(
    show,
    {
      login,
      password,
      keepSignedIn,
      incorrect,
      error,
      mode,
      panel,
      submitError,
      networkError,
      countdown,
    },
    {
      onClose: handleClose,
      onCancel: handleClose,
      onSubmit: handleSubmit,
      onDeviceSubmit: handleDeviceSubmit,
      onModeChange: (nextMode) => controller.switchMode(nextMode),
      onTryAgain: () => controller.switchMode(MODE_DEVICE),
      onLoginChange: (event) => setLogin(event.target.value),
      onPasswordChange: (event) => setPassword(event.target.value),
      onKeepSignedInChange: (event) => setKeepSignedIn(event.target.checked),
    }
  );
}
