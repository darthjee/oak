import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';

/**
 * Extracts category slug and item id from a category item edit hash route.
 *
 * @param {string} [hash=''] current location hash
 * @returns {{slug: string, id: string}} route params or empty values when unresolved
 */
export function getCategoryItemEditParamsFromHash(hash = '') {
  const path = hash.split('?')[0];
  const match = path.match(/^#\/categories\/([^/]+)\/items\/([^/]+)\/edit\/?$/);

  return {
    slug: match?.[1] || '',
    id: match?.[2] || '',
  };
}

/**
 * Manages category item edit page state and save flow.
 */
export default class CategoryItemEditController extends BasePageController {
  /**
   * Creates a new CategoryItemEditController instance.
   *
   * @param {Function} setItem state setter for item data
   * @param {Function} setKinds state setter for kinds list
   * @param {Function} setLoading state setter for loading status
   * @param {Function} setSaving state setter for saving status
   * @param {Function} setError state setter for error message
   * @param {GenericClient|null} [client] optional client instance
   * @param {Object|null} [locationTarget] optional location target used for redirects
   */
  constructor(setItem, setKinds, setLoading, setSaving, setError, client = null, locationTarget = null) {
    super();
    this.setItem = setItem;
    this.setKinds = setKinds;
    this.setLoading = setLoading;
    this.setSaving = setSaving;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.locationTarget = locationTarget ?? (typeof window === 'undefined' ? { hash: '' } : window.location);
  }

  /**
   * Builds the React effect that loads category item and kinds on mount.
   *
   * @returns {Function} effect function that starts loading and returns a cleanup function
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const { slug, id } = getCategoryItemEditParamsFromHash(this.client.currentHash());

      this.#loadData(safeSet, slug, id);

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Persists edited item data and redirects to the item details page on success.
   *
   * @param {Object} item edited item state
   * @returns {Promise<void>} save promise
   */
  save(item) {
    const { slug, id } = getCategoryItemEditParamsFromHash(this.client.currentHash());

    if (!slug || !id || !item) {
      this.setError('Unable to save category item.');
      return Promise.reject(new Error('Unable to save category item.'));
    }

    this.setSaving(true);
    this.setError(null);

    return this.client.patch(`/categories/${slug}/items/${id}.json`, this.#buildPayload(item))
      .then(() => {
        this.locationTarget.hash = `#/categories/${slug}/items/${id}`;
      })
      .catch(() => {
        this.setError('Unable to save category item.');
      })
      .finally(() => {
        this.setSaving(false);
      });
  }

  #loadData(safeSet, slug, id) {
    Promise.all([
      this.#fetchItem(slug, id),
      this.#fetchKinds(slug),
    ])
      .then(([item, kinds]) => {
        safeSet(this.setItem, this.#normalizeItem(item));
        safeSet(this.setKinds, kinds);
      })
      .catch((error) => {
        safeSet(this.setError, error?.message || 'Unable to load category item edit form.');
      })
      .finally(() => {
        safeSet(this.setLoading, false);
      });
  }

  #normalizeItem(item) {
    return {
      ...item,
      kind_slug: item.kind_slug || item.kind?.slug || '',
      links: Array.isArray(item.links) ? item.links : [],
    };
  }

  #buildPayload(item) {
    return {
      item: {
        name: item.name || '',
        description: item.description || '',
        kind_slug: item.kind_slug || '',
        visible: item.visible,
        links: (Array.isArray(item.links) ? item.links : []).map((link, index) => ({
          id: link.id,
          text: link.text || '',
          url: link.url || '',
          order: link.order ?? index + 1,
        })),
      },
    };
  }

  #fetchItem(slug, id) {
    if (!slug || !id) {
      return Promise.reject(new Error('Unable to load category item edit form.'));
    }

    return this.client.fetch(`/categories/${slug}/items/${id}.json`)
      .catch(() => { throw new Error('Unable to load category item edit form.'); });
  }

  #fetchKinds(slug) {
    if (!slug) {
      return Promise.reject(new Error('Unable to load category item edit form.'));
    }

    return this.client.fetch(`/categories/${slug}/kinds.json`)
      .then((kinds) => (Array.isArray(kinds) ? kinds : []))
      .catch(() => { throw new Error('Unable to load category item edit form.'); });
  }
}
