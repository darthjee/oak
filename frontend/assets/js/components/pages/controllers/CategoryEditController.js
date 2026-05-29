import CategoryFormController from './CategoryFormController.js';
import Router from '../../../utils/Router.js';

/**
 * Extracts category slug from a category edit hash route.
 *
 * @param {string} [hash=''] current location hash
 * @returns {string} category slug or an empty string when it cannot be resolved
 */
export function getCategoryEditSlugFromHash(hash = '') {
  return Router.extractParams('/categories/:slug/edit', hash).slug || '';
}

/**
 * Manages category edit page state and update flow.
 */
export default class CategoryEditController extends CategoryFormController {

  /**
   * Builds the React effect that loads category edit form data and all kinds on mount.
   *
   * @returns {Function} effect function that starts loading and returns a cleanup function
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const slug = getCategoryEditSlugFromHash(this.client.currentHash());

      this.#loadData(safeSet, slug);

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Updates a category and redirects to the category page on success.
   *
   * @param {Object} category category state to submit
   * @returns {Promise<void>} save promise
   */
  save(category) {
    const slug = getCategoryEditSlugFromHash(this.client.currentHash());

    if (!slug || !category) {
      this.setError('Unable to save category.');
      return Promise.reject(new Error('Unable to save category.'));
    }

    this.setSaving(true);
    this.setError(null);

    return this.client.patch(`/categories/${slug}`, this.buildPayload(category))
      .then((saved) => this.#onSaveSuccess(saved, slug))
      .catch(() => this.onSaveError())
      .finally(() => this.finalizeSave());
  }

  #loadData(safeSet, slug) {
    Promise.all([
      this.#fetchCategory(slug),
      this.#fetchKinds(),
    ])
      .then(([category, kinds]) => this.applyLoadedData(safeSet, category, kinds))
      .catch((error) => this.#onLoadError(safeSet, error))
      .finally(() => this.finalizeLoad(safeSet));
  }

  #fetchCategory(slug) {
    if (!slug) {
      return Promise.reject(new Error('Unable to load category edit form.'));
    }

    return this.client.fetch(`/categories/${slug}.json`)
      .then(this.normalizeCategory.bind(this))
      .catch(() => { throw new Error('Unable to load category edit form.'); });
  }

  #fetchKinds() {
    return this.fetchKinds('Unable to load category edit form.');
  }

  #onSaveSuccess(saved, fallbackSlug) {
    const slug = saved?.slug || fallbackSlug;
    this.locationTarget.hash = `#/categories/${slug}`;
  }

  #onLoadError(safeSet, error) {
    safeSet(this.setError, error?.message || 'Unable to load category edit form.');
  }
}
