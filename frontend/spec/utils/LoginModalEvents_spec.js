import LoginModalEvents, {
  LOGIN_MODAL_EVENT,
  LOGIN_MODAL_MODES,
  MODE_DEVICE,
  MODE_PASSWORD,
} from '../../assets/js/utils/LoginModalEvents.js';
import { preserveGlobals } from '../support/factories.js';

describe('LoginModalEvents', function() {
  let restoreGlobals;
  let listener;
  let unsubscribe;

  beforeEach(function() {
    restoreGlobals = preserveGlobals('window');
    global.window = new EventTarget();
    listener = jasmine.createSpy('listener');
  });

  afterEach(function() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = undefined;
    }

    restoreGlobals();
  });

  describe('constants', function() {
    it('exposes the event name', function() {
      expect(LOGIN_MODAL_EVENT).toEqual('oak:login-modal');
    });

    it('exposes the allowed modes', function() {
      expect(LOGIN_MODAL_MODES).toEqual([MODE_PASSWORD, MODE_DEVICE]);
    });
  });

  describe('open', function() {
    beforeEach(function() {
      unsubscribe = LoginModalEvents.subscribe(listener);
    });

    it('dispatches open with password mode by default', function() {
      LoginModalEvents.open();

      expect(listener).toHaveBeenCalledWith({ open: true, mode: 'password' });
    });

    it('dispatches open with device mode', function() {
      LoginModalEvents.open('device');

      expect(listener).toHaveBeenCalledWith({ open: true, mode: 'device' });
    });

    it('falls back to password mode for unknown modes', function() {
      LoginModalEvents.open('unknown');

      expect(listener).toHaveBeenCalledWith({ open: true, mode: 'password' });
    });

    it('dispatches the event on window', function() {
      const raw = jasmine.createSpy('raw');

      window.addEventListener('oak:login-modal', raw);
      LoginModalEvents.open('device');
      window.removeEventListener('oak:login-modal', raw);

      expect(raw).toHaveBeenCalledTimes(1);
      expect(raw.calls.mostRecent().args[0].detail).toEqual({ open: true, mode: 'device' });
    });
  });

  describe('close', function() {
    beforeEach(function() {
      unsubscribe = LoginModalEvents.subscribe(listener);
    });

    it('dispatches close with password mode', function() {
      LoginModalEvents.close();

      expect(listener).toHaveBeenCalledWith({ open: false, mode: 'password' });
    });
  });

  describe('subscribe', function() {
    it('receives every event detail', function() {
      unsubscribe = LoginModalEvents.subscribe(listener);

      LoginModalEvents.open('device');
      LoginModalEvents.close();

      expect(listener.calls.allArgs()).toEqual([
        [{ open: true, mode: 'device' }],
        [{ open: false, mode: 'password' }],
      ]);
    });

    it('stops delivering events after unsubscribing', function() {
      const stop = LoginModalEvents.subscribe(listener);

      stop();
      LoginModalEvents.open();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('when window is undefined', function() {
    beforeEach(function() {
      global.window = undefined;
    });

    it('open is a no-op', function() {
      expect(() => LoginModalEvents.open('device')).not.toThrow();
    });

    it('close is a no-op', function() {
      expect(() => LoginModalEvents.close()).not.toThrow();
    });

    it('subscribe returns a no-op unsubscribe', function() {
      const stop = LoginModalEvents.subscribe(listener);

      expect(typeof stop).toEqual('function');
      expect(() => stop()).not.toThrow();
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
