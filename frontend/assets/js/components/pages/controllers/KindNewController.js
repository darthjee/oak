import KindFormController from './KindFormController.js';

/**
 * Manages kind new page state and create flow.
 */
export default class KindNewController extends KindFormController {

  /**
   * Builds the React effect that loads new kind form data on mount.
   *
   * @returns {Function} effect function that starts loading and returns a cleanup function
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      this.#loadData(safeSet);

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Creates a new kind and redirects to the kind page on success.
   *
   * @param {Object} kind kind state to submit
   * @returns {Promise<void>} save promise
   */
  save(kind) {
    if (!kind) {
      this.setError('Unable to save kind.');
      return Promise.reject(new Error('Unable to save kind.'));
    }

    this.setSaving(true);
    this.setError(null);

    return this.client.post('/kinds.json', this.buildPayload(kind))
      .then((saved) => this.#onSaveSuccess(saved))
      .catch(() => this.onSaveError())
      .finally(() => this.finalizeSave());
  }

  /**
   * Returns the cancel/back href for the new kind page.
   *
   * @returns {string} href pointing to the kinds index
   */
  cancelHref() {
    return '/#/kinds';
  }

  #loadData(safeSet) {
    this.#fetchKind()
      .then((kind) => safeSet(this.setKind, kind))
      .catch((error) => this.#onLoadError(safeSet, error))
      .finally(() => this.finalizeLoad(safeSet));
  }

  #fetchKind() {
    return this.client.fetch('/kinds/new.json')
      .then(this.normalizeKind.bind(this))
      .catch(() => { throw new Error('Unable to load kind new form.'); });
  }

  #onSaveSuccess(saved) {
    const slug = saved?.slug || '';
    this.locationTarget.hash = `#/kinds/${slug}`;
  }

  #onLoadError(safeSet, error) {
    safeSet(this.setError, error?.message || 'Unable to load kind new form.');
  }
}
