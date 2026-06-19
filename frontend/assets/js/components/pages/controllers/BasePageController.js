/**
 * Shared behavior for page controllers.
 */
export default class BasePageController {
  /**
   * Creates a setter wrapper that only runs while a page is mounted.
   *
   * @param {Function} isMounted callback returning current mounted state
   * @returns {Function} guarded setter
   */
  buildSafeSetter(isMounted) {
    return (setter, value) => {
      if (!isMounted()) {
        return;
      }

      setter(value);
    };
  }
}
