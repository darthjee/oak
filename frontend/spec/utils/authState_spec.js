import { isLoggedIn, setLoggedIn, subscribe } from '../../assets/js/utils/authState.js';

describe('authState', function() {
  afterEach(function() {
    setLoggedIn(false);
  });

  describe('subscribe', function() {
    it('notifies listeners when the login state changes', function() {
      const listener = jasmine.createSpy('listener');
      const unsubscribe = subscribe(listener);

      setLoggedIn(true);

      expect(listener).toHaveBeenCalledWith(true);

      unsubscribe();
    });

    it('does not notify listeners when the value does not change', function() {
      const listener = jasmine.createSpy('listener');
      const unsubscribe = subscribe(listener);

      setLoggedIn(false);

      expect(listener).not.toHaveBeenCalled();

      unsubscribe();
    });

    it('stops notifying after unsubscribing', function() {
      const listener = jasmine.createSpy('listener');
      const unsubscribe = subscribe(listener);

      unsubscribe();
      setLoggedIn(true);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('isLoggedIn', function() {
    it('returns false by default', function() {
      expect(isLoggedIn()).toBe(false);
    });

    it('returns true after setLoggedIn(true)', function() {
      setLoggedIn(true);

      expect(isLoggedIn()).toBe(true);
    });

    it('returns false after setLoggedIn(false)', function() {
      setLoggedIn(true);
      setLoggedIn(false);

      expect(isLoggedIn()).toBe(false);
    });
  });

  describe('setLoggedIn', function() {
    it('coerces truthy values to true', function() {
      setLoggedIn({ token: 'abc' });

      expect(isLoggedIn()).toBe(true);
    });

    it('coerces falsy values to false', function() {
      setLoggedIn(true);
      setLoggedIn(null);

      expect(isLoggedIn()).toBe(false);
    });
  });
});
