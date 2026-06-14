import { isLoggedIn, setLoggedIn } from '../../assets/js/utils/authState.js';

describe('authState', function() {
  afterEach(function() {
    setLoggedIn(false);
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
