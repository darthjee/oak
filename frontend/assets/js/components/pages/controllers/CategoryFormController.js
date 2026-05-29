import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';

/**
 * Shared behavior for category form pages.
 */
export default class CategoryFormController extends BasePageController {
  /**
   * Creates a new CategoryFormController instance.
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
   * Normalizes category fields used by form pages.
   *
   * @param {Object} category raw category response
   * @returns {Object} normalized category object
   */
  normalizeCategory(category) {
    return {
      ...category,
      name: category.name || '',
      kinds: Array.isArray(category.kinds) ? category.kinds : [],
    };
  }

  /**
   * Builds category payload for create and update actions.
   *
   * @param {Object} category category state to serialize
   * @returns {Object} request payload
   */
  buildPayload(category) {
    return {
      category: {
        name: category.name || '',
        kinds: (category.kinds || []).map((k) => ({ slug: k.slug })),
      },
    };
  }

  /**
   * Fetches available kinds and normalizes response.
   *
   * @param {string} loadErrorMessage error message used when request fails
   * @returns {Promise<Object[]>} kinds list
   */
  fetchKinds(loadErrorMessage) {
    return this.client.fetch('/kinds.json')
      .then((kinds) => (Array.isArray(kinds) ? kinds : []))
      .catch(() => { throw new Error(loadErrorMessage); });
  }

  /**
   * Applies loaded category and kinds data to state setters.
   *
   * @param {Function} safeSet guarded setter helper
   * @param {Object} category normalized category data
   * @param {Object[]} kinds kinds list
   */
  applyLoadedData(safeSet, category, kinds) {
    safeSet(this.setCategory, category);
    safeSet(this.setKinds, kinds);
  }

  /**
   * Applies save error message to state.
   */
  onSaveError() {
    this.setError('Unable to save category.');
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
}
