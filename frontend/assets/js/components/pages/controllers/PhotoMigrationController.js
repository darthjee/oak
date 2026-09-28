import PhotoMigrationClient from '../../../client/PhotoMigrationClient.js';
import BasePageController from './BasePageController.js';
import { isLoggedIn, subscribe } from '../../../utils/authState.js';

/**
 * Number of photos requested per migration batch (the backend clamps it to 1..50).
 */
export const BATCH_LIMIT = 20;

/**
 * Statuses after which the loop is over and cannot be started again.
 */
export const TERMINAL_STATUSES = ['done', 'stopped', 'noProgress', 'error'];

/**
 * Builds the empty totals used before the first batch.
 *
 * @returns {{migrated: number, missing: number[], failed: Array<{id: number, reason: string}>, remaining: (number|null)}}
 *   empty totals
 */
export function buildEmptyTotals() {
  return { migrated: 0, missing: [], failed: [], remaining: null };
}

/**
 * Drives the photo migration request loop and tracks login state, totals and status.
 *
 * Each instance allows a single run: once the loop reaches a terminal status
 * (`done`, `stopped`, `noProgress` or `error`), `start()` is a no-op.
 */
export default class PhotoMigrationController extends BasePageController {
  #status = 'idle';
  #totals = buildEmptyTotals();
  #stopRequested = false;
  #mounted = false;

  /**
   * Creates a new PhotoMigrationController instance.
   *
   * @param {Function} setLogged state setter for login status
   * @param {Function} setStatus state setter for the loop status
   * @param {Function} setTotals state setter for the accumulated totals
   * @param {Function} setError state setter for the error message
   * @param {PhotoMigrationClient|null} [client] optional client instance
   */
  constructor(setLogged, setStatus, setTotals, setError, client = null) {
    super();
    this.setLogged = setLogged;
    this.setStatus = setStatus;
    this.setTotals = setTotals;
    this.setError = setError;
    this.client = client ?? new PhotoMigrationClient();
    this.safeSet = this.buildSafeSetter(() => this.#mounted);
  }

  /**
   * Builds the React effect that tracks login state and marks the controller mounted.
   *
   * @returns {Function} effect function returning a cleanup that unsubscribes and
   *   marks the controller unmounted, which also stops the loop
   */
  buildEffect() {
    return () => {
      this.#mounted = true;

      this.safeSet(this.setLogged, isLoggedIn());
      const unsubscribe = subscribe((logged) => this.safeSet(this.setLogged, logged));

      return () => {
        this.#mounted = false;
        unsubscribe();
      };
    };
  }

  /**
   * Current loop status.
   *
   * @returns {string} one of `idle`, `running`, `stopping`, `done`, `stopped`, `noProgress`, `error`
   */
  get status() {
    return this.#status;
  }

  /**
   * Current accumulated totals.
   *
   * @returns {{migrated: number, missing: number[], failed: Array<{id: number, reason: string}>, remaining: (number|null)}}
   *   accumulated totals
   */
  get totals() {
    return this.#totals;
  }

  /**
   * Starts the migration loop. Only works from `idle`, so each page load allows one run.
   *
   * @returns {Promise<void>} resolves when the loop ends
   */
  async start() {
    if (this.#status !== 'idle') {
      return;
    }

    this.#updateStatus('running');
    await this.#loop();
  }

  /**
   * Requests the loop to stop after the request in flight finishes. Only works while running.
   *
   * @returns {void}
   */
  stop() {
    if (this.#status !== 'running') {
      return;
    }

    this.#stopRequested = true;
    this.#updateStatus('stopping');
  }

  async #loop() {
    for (;;) {
      let batch;

      try {
        batch = await this.client.migrate(BATCH_LIMIT);
      } catch (error) {
        this.safeSet(this.setError, PhotoMigrationController.#errorMessage(error));
        this.#updateStatus('error');
        return;
      }

      this.#merge(batch);

      const nextStatus = this.#nextStatus(batch);

      if (nextStatus) {
        this.#updateStatus(nextStatus);
        return;
      }
    }
  }

  #nextStatus(batch) {
    if (batch.remaining === 0) {
      return 'done';
    }

    if ((batch.migrated || 0) + (batch.missing || []).length === 0) {
      return 'noProgress';
    }

    if (this.#stopRequested || !this.#mounted) {
      return 'stopped';
    }

    return null;
  }

  #merge(batch) {
    this.#totals = {
      migrated: this.#totals.migrated + (batch.migrated || 0),
      missing: [...this.#totals.missing, ...(batch.missing || [])],
      failed: [...this.#totals.failed, ...(batch.failed || [])],
      remaining: batch.remaining,
    };
    this.safeSet(this.setTotals, this.#totals);
  }

  #updateStatus(status) {
    this.#status = status;
    this.safeSet(this.setStatus, status);
  }

  static #errorMessage(error) {
    const status = error?.status;

    if (status === 401 || status === 403) {
      return 'You need to be logged in to migrate photos.';
    }

    if (status) {
      return `Migration request failed (status ${status}).`;
    }

    return 'Migration request failed.';
  }
}
