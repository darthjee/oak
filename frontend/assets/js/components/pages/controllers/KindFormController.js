import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';

/**
 * Shared behavior for kind form pages.
 */
export default class KindFormController extends BasePageController {
  /**
   * Creates a new KindFormController instance.
   *
   * @param {Function} setKind state setter for kind data
   * @param {Function} setCategories state setter for all available categories
   * @param {Function} setLoading state setter for loading status
   * @param {Function} setSaving state setter for saving status
   * @param {Function} setError state setter for error message
   * @param {GenericClient|null} [client] optional client instance
   * @param {Object|null} [locationTarget] optional location target used for redirects
   */
  constructor(setKind, setCategories, setLoading, setSaving, setError, client = null, locationTarget = null) {
    super();
    this.setKind = setKind;
    this.setCategories = setCategories;
    this.setLoading = setLoading;
    this.setSaving = setSaving;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.locationTarget = locationTarget ?? (typeof window === 'undefined' ? { hash: '' } : window.location);
  }

  /**
   * Updates a single field on the current kind state.
   *
   * @param {string} field field name to update
   * @param {string} value new field value
   */
  onFieldChange(field, value) {
    this.setKind((current) => ({ ...current, [field]: value }));
  }

  /**
   * Adds a category to the kind categories list if not already present.
   *
   * @param {Object|null} category category object with slug and name to add
   */
  onAddCategory(category) {
    if (!category || !category.slug) {
      return;
    }

    this.setKind((current) => this.#appendCategory(current, category));
  }

  /**
   * Removes the category with the given slug from the kind categories list.
   *
   * @param {string} slug slug of the category to remove
   */
  onRemoveCategory(slug) {
    this.setKind((current) => ({
      ...current,
      categories: (current.categories || []).filter((c) => c.slug !== slug),
    }));
  }

  /**
   * Normalizes kind fields used by form pages.
   *
   * @param {Object} kind raw kind response
   * @returns {Object} normalized kind object
   */
  normalizeKind(kind) {
    return {
      ...kind,
      name: kind.name || '',
      categories: Array.isArray(kind.categories) ? kind.categories : [],
    };
  }

  /**
   * Builds kind payload for create and update actions.
   *
   * @param {Object} kind kind state to serialize
   * @returns {Object} request payload
   */
  buildPayload(kind) {
    return {
      kind: {
        name: kind.name || '',
        categories: (kind.categories || []).map(({ slug }) => ({ slug })),
      },
    };
  }

  /**
   * Fetches all available categories (including empty ones) and normalizes the response.
   *
   * @param {string} loadErrorMessage error message used when request fails
   * @returns {Promise<Object[]>} categories list
   */
  fetchCategories(loadErrorMessage) {
    return this.client.fetch('/categories.json?filters[include_empty]=true')
      .then((categories) => (Array.isArray(categories) ? categories : []))
      .catch(() => { throw new Error(loadErrorMessage); });
  }

  /**
   * Applies loaded kind and categories data to state setters.
   *
   * @param {Function} safeSet guarded setter helper
   * @param {Object} kind normalized kind data
   * @param {Object[]} categories available categories list
   */
  applyLoadedData(safeSet, kind, categories) {
    safeSet(this.setKind, kind);
    safeSet(this.setCategories, categories);
  }

  /**
   * Applies save error message to state.
   */
  onSaveError() {
    this.setError('Unable to save kind.');
  }

  /**
   * Stops save loading state.
   */
  finalizeSave() {
    this.setSaving(false);
  }

  /**
   * Stops page loading state.
   *
   * @param {Function} safeSet guarded setter helper
   */
  finalizeLoad(safeSet) {
    safeSet(this.setLoading, false);
  }

  #appendCategory(current, category) {
    const categories = current.categories || [];

    if (categories.some((c) => c.slug === category.slug)) {
      return current;
    }

    return { ...current, categories: [...categories, category] };
  }
}
