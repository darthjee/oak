import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';

/**
 * Manages category new page state and create flow.
 */
export default class CategoryNewController extends BasePageController {
  /**
   * Creates a new CategoryNewController instance.
   *
   * @param {Function} setCategory state setter for category data
   * @param {Function} setKinds state setter for all available kinds
   * @param {Function} setLoading state setter for loading status
   * @param {Function} setSaving state setter for saving status
   * @param {Function} setError state setter for error message
   * @param {GenericClient|null} [client] optional client instance
   * @param {Object|null} [locationTarget] optional location target used for redirects
   */
  constructor(setCategory, setKinds, setLoading, setSaving, setError, client = null, locationTarget = null) {
    super();
    this.setCategory = setCategory;
    this.setKinds = setKinds;
    this.setLoading = setLoading;
    this.setSaving = setSaving;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.locationTarget = locationTarget ?? (typeof window === 'undefined' ? { hash: '' } : window.location);
  }

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

    return this.client.post('/categories.json', this.#buildPayload(category))
      .then((saved) => this.#onSaveSuccess(saved))
      .catch(() => this.#onSaveError())
      .finally(() => this.#finalizeSave());
  }

  /**
   * Updates a single field on the current category state.
   *
   * @param {string} field field name to update
   * @param {string} value new field value
   */
  onFieldChange(field, value) {
    this.setCategory((current) => ({ ...current, [field]: value }));
  }

  /**
   * Adds a kind to the category kinds list if not already present.
   *
   * @param {Object|null} kind kind object with slug and name to add
   */
  onAddKind(kind) {
    if (!kind || !kind.slug) {
      return;
    }

    this.setCategory((current) => {
      const kinds = current.kinds || [];

      if (kinds.some((k) => k.slug === kind.slug)) {
        return current;
      }

      return { ...current, kinds: [...kinds, kind] };
    });
  }

  /**
   * Removes the kind with the given slug from the category kinds list.
   *
   * @param {string} slug slug of the kind to remove
   */
  onRemoveKind(slug) {
    this.setCategory((current) => ({
      ...current,
      kinds: (current.kinds || []).filter((k) => k.slug !== slug),
    }));
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
      .then(([category, kinds]) => this.#applyLoadedData(safeSet, category, kinds))
      .catch((error) => this.#onLoadError(safeSet, error))
      .finally(() => this.#finalizeLoad(safeSet));
  }

  #fetchCategory() {
    return this.client.fetch('/categories/new.json')
      .then(CategoryNewController.#normalizeCategory)
      .catch(() => { throw new Error('Unable to load category new form.'); });
  }

  #fetchKinds() {
    return this.client.fetch('/kinds.json')
      .then((kinds) => (Array.isArray(kinds) ? kinds : []))
      .catch(() => { throw new Error('Unable to load category new form.'); });
  }

  static #normalizeCategory(category) {
    return {
      ...category,
      name: category.name || '',
      kinds: Array.isArray(category.kinds) ? category.kinds : [],
    };
  }

  #buildPayload(category) {
    return {
      category: {
        name: category.name || '',
        kinds: (category.kinds || []).map((k) => ({ slug: k.slug })),
      },
    };
  }

  #applyLoadedData(safeSet, category, kinds) {
    safeSet(this.setCategory, category);
    safeSet(this.setKinds, kinds);
  }

  #onSaveSuccess(saved) {
    const slug = saved?.slug || '';
    this.locationTarget.hash = `#/categories/${slug}`;
  }

  #onSaveError() {
    this.setError('Unable to save category.');
  }

  #finalizeSave() {
    this.setSaving(false);
  }

  #onLoadError(safeSet, error) {
    safeSet(this.setError, error?.message || 'Unable to load category new form.');
  }

  #finalizeLoad(safeSet) {
    safeSet(this.setLoading, false);
  }
}
