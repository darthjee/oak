import KindFormController from './KindFormController.js';
import Router from '../../../utils/Router.js';

/**
 * Extracts kind slug from a kind edit hash route.
 *
 * @param {string} [hash=''] current location hash
 * @returns {string} kind slug or an empty string when it cannot be resolved
 */
export function getKindEditSlugFromHash(hash = '') {
  return Router.extractParams('/kinds/:slug/edit', hash).slug || '';
}

/**
 * Manages kind edit page state and update flow.
 */
export default class KindEditController extends KindFormController {

  /**
   * Builds the React effect that loads kind edit form data on mount.
   *
   * @returns {Function} effect function that starts loading and returns a cleanup function
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const slug = getKindEditSlugFromHash(this.client.currentHash());

      this.#loadData(safeSet, slug);

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Updates a kind and redirects to the kind page on success.
   *
   * @param {Object} kind kind state to submit
   * @returns {Promise<void>} save promise
   */
  save(kind) {
    const slug = getKindEditSlugFromHash(this.client.currentHash());

    if (!slug || !kind) {
      this.setError('Unable to save kind.');
      return Promise.reject(new Error('Unable to save kind.'));
    }

    this.setSaving(true);
    this.setError(null);

    return this.client.patch(`/kinds/${slug}`, this.buildPayload(kind))
      .then((saved) => this.#onSaveSuccess(saved, slug))
      .catch(() => this.onSaveError())
      .finally(() => this.finalizeSave());
  }

  #loadData(safeSet, slug) {
    this.#fetchKind(slug)
      .then((kind) => safeSet(this.setKind, kind))
      .catch((error) => this.#onLoadError(safeSet, error))
      .finally(() => this.finalizeLoad(safeSet));
  }

  #fetchKind(slug) {
    if (!slug) {
      return Promise.reject(new Error('Unable to load kind edit form.'));
    }

    return this.client.fetch(`/kinds/${slug}/edit.json`)
      .then(this.normalizeKind.bind(this))
      .catch(() => { throw new Error('Unable to load kind edit form.'); });
  }

  #onSaveSuccess(saved, fallbackSlug) {
    const slug = saved?.slug || fallbackSlug;
    this.locationTarget.hash = `#/kinds/${slug}`;
  }

  #onLoadError(safeSet, error) {
    safeSet(this.setError, error?.message || 'Unable to load kind edit form.');
  }
}
