import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';

/**
 * Extracts category slug from a category item new hash route.
 *
 * @param {string} [hash=''] current location hash
 * @returns {{slug: string}} route params or empty values when unresolved
 */
export function getCategoryItemNewParamsFromHash(hash = '') {
  return {
    slug: '',
    ...Router.extractParams('/categories/:slug/items/new', hash),
  };
}

/**
 * Manages category item new page state and create flow.
 */
export default class CategoryItemNewController extends BasePageController {
  /**
   * Creates a new CategoryItemNewController instance.
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
   * Builds the React effect that loads new item form data and kinds on mount.
   *
   * @returns {Function} effect function that starts loading and returns a cleanup function
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const { slug } = getCategoryItemNewParamsFromHash(this.client.currentHash());

      this.#loadData(safeSet, slug);

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Creates a new item and redirects to the category items index on success.
   *
   * @param {Object} item item state to submit
   * @returns {Promise<void>} save promise
   */
  save(item) {
    const { slug } = getCategoryItemNewParamsFromHash(this.client.currentHash());

    if (!slug || !item) {
      this.setError('Unable to save category item.');
      return Promise.reject(new Error('Unable to save category item.'));
    }

    this.setSaving(true);
    this.setError(null);

    return this.client.post(`/categories/${slug}/items.json`, this.#buildPayload(item))
      .then(() => {
        this.locationTarget.hash = `#/categories/${slug}/items`;
      })
      .catch(() => {
        this.setError('Unable to save category item.');
      })
      .finally(() => {
        this.setSaving(false);
      });
  }

  /**
   * Updates a single field on the current item state.
   *
   * @param {string} field field name to update
   * @param {string} value new field value
   */
  onFieldChange(field, value) {
    this.setItem((current) => ({ ...current, [field]: value }));
  }

  /**
   * Updates a field on a link at the given index.
   *
   * @param {number} index link index
   * @param {string} field field name to update
   * @param {string} value new field value
   */
  onLinkChange(index, field, value) {
    this.setItem((current) => {
      const links = [...(current.links || [])];
      links[index] = { ...(links[index] || {}), [field]: value };
      return { ...current, links };
    });
  }

  /**
   * Removes the link at the given index from the current item state.
   *
   * @param {number} index link index to remove
   */
  onRemoveLink(index) {
    this.setItem((current) => {
      const links = [...(current.links || [])];
      links.splice(index, 1);
      return { ...current, links };
    });
  }

  /**
   * Appends an empty link entry to the current item state.
   */
  onAddLink() {
    this.setItem((current) => ({
      ...current,
      links: [...(current.links || []), { text: '', url: '' }],
    }));
  }

  /**
   * Returns the cancel/back href for the new item page.
   *
   * @param {Object} item current item state
   * @returns {string} href pointing to the category items index
   */
  cancelHref(item) {
    const slug = item?.category?.slug || '';
    return `/#/categories/${slug}/items`;
  }

  #loadData(safeSet, slug) {
    Promise.all([
      this.#fetchItem(slug),
      this.#fetchKinds(slug),
    ])
      .then(([item, kinds]) => this.#applyLoadedData(safeSet, item, kinds))
      .catch((error) => {
        safeSet(this.setError, error?.message || 'Unable to load category item new form.');
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
        links: this.#buildLinkPayload(item.links),
      },
    };
  }

  #applyLoadedData(safeSet, item, kinds) {
    safeSet(this.setItem, this.#normalizeItem(item));
    safeSet(this.setKinds, kinds);
  }

  #buildLinkPayload(links) {
    return (Array.isArray(links) ? links : []).map((link, index) => ({
      id: link.id,
      text: link.text || '',
      url: link.url || '',
      order: link.order ?? index + 1,
    }));
  }

  #fetchItem(slug) {
    if (!slug) {
      return Promise.reject(new Error('Unable to load category item new form.'));
    }

    return this.client.fetch(`/categories/${slug}/items/new.json`)
      .catch(() => { throw new Error('Unable to load category item new form.'); });
  }

  #fetchKinds(slug) {
    if (!slug) {
      return Promise.reject(new Error('Unable to load category item new form.'));
    }

    return this.client.fetch(`/categories/${slug}/kinds.json`)
      .then((kinds) => (Array.isArray(kinds) ? kinds : []))
      .catch(() => { throw new Error('Unable to load category item new form.'); });
  }
}
