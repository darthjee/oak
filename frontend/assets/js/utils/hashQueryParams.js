/**
 * Builds URLSearchParams from the current hash route query string.
 *
 * @param {string} [hash=''] current location hash
 * @returns {URLSearchParams} parsed query params from the hash route
 */
export default function getHashQueryParams(hash = '') {
  const questionMarkIndex = hash.indexOf('?');

  if (questionMarkIndex === -1) {
    return new URLSearchParams();
  }

  return new URLSearchParams(hash.slice(questionMarkIndex + 1));
}
