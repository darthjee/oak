import CategoryFormController from './CategoryFormController.js';

/**
 * Manages category new page state and create flow.
 */
export default class CategoryNewController extends CategoryFormController {

  /**
   * Builds the React effect that loads new category form data and all kinds on mount.
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
   * Creates a new category and redirects to the category page on success.
   *
   * @param {Object} category category state to submit
   * @returns {Promise<void>} save promise
   */
  save(category) {
    if (!category) {
      this.setError('Unable to save category.');
      return Promise.reject(new Error('Unable to save category.'));
    }

    this.setSaving(true);
    this.setError(null);

    return this.client.post('/categories.json', this.buildPayload(category))
      .then((saved) => this.#onSaveSuccess(saved))
      .catch(() => this.onSaveError())
      .finally(() => this.finalizeSave());
  }

  /**
   * Returns the cancel/back href for the new category page.
   *
   * @returns {string} href pointing to the categories index
   */
  cancelHref() {
    return '/#/categories';
  }

  #loadData(safeSet) {
    Promise.all([
      this.#fetchCategory(),
      this.#fetchKinds(),
    ])
      .then(([category, kinds]) => this.applyLoadedData(safeSet, category, kinds))
      .catch((error) => this.#onLoadError(safeSet, error))
      .finally(() => this.finalizeLoad(safeSet));
  }

  #fetchCategory() {
    return this.client.fetch('/categories/new.json')
      .then(this.normalizeCategory.bind(this))
      .catch(() => { throw new Error('Unable to load category new form.'); });
  }

  #fetchKinds() {
    return this.fetchKinds('Unable to load category new form.');
  }

  #onSaveSuccess(saved) {
    const slug = saved?.slug || '';
    this.locationTarget.hash = `#/categories/${slug}`;
  }

  #onLoadError(safeSet, error) {
    safeSet(this.setError, error?.message || 'Unable to load category new form.');
  }
}
