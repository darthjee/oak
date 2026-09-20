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
   * @param {Function} setLoading state setter for loading status
   * @param {Function} setSaving state setter for saving status
   * @param {Function} setError state setter for error message
   * @param {GenericClient|null} [client] optional client instance
   * @param {Object|null} [locationTarget] optional location target used for redirects
   */
  constructor(setKind, setLoading, setSaving, setError, client = null, locationTarget = null) {
    super();
    this.setKind = setKind;
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
   * Normalizes kind fields used by form pages.
   *
   * @param {Object} kind raw kind response
   * @returns {Object} normalized kind object
   */
  normalizeKind(kind) {
    return {
      ...kind,
      name: kind.name || '',
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
      },
    };
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
}
