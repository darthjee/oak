/**
 * Builds a random, non-literal credential value for specs, so no
 * secret-looking string literal is hardcoded in the test suite.
 *
 * @param {string} [prefix='pw'] - Prefix prepended to the random part.
 * @returns {string} A freshly generated value, unique per call.
 */
export const randomCredential = (prefix = 'pw') => `${prefix}-${Math.random().toString(36).slice(2)}`;
