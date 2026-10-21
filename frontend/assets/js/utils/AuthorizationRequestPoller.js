const FINAL_STATUSES = ['denied', 'expired', 'logged'];

/**
 * Polls a device authorization request until it reaches a final result.
 *
 * Polls run through a `setTimeout` chain (never overlapping) and a separate one-shot timer ends
 * the run once `expiresAt` passes. A stopped or restarted poller ignores in-flight responses.
 */
export default class AuthorizationRequestPoller {
  #client;
  #onApproved;
  #onFinal;
  #onNetworkError;
  #interval;
  #now;
  #run = null;
  #pollTimer = null;
  #expiryTimer = null;
  #failing = false;

  /**
   * Builds a poller.
   *
   * @param {object} options poller options
   * @param {object} options.client client exposing `poll(uuid, pollToken)`
   * @param {Function} options.onApproved called once the request is approved
   * @param {Function} options.onFinal called with the final panel name
   *   (`denied`, `expired`, `logged` or `notFound`)
   * @param {Function} options.onNetworkError called with `true` when a poll fails and with
   *   `false` when polling recovers
   * @param {number} [options.interval=5000] delay between polls in milliseconds
   * @param {Function} [options.now] clock returning the current time in milliseconds
   */
  constructor({
    client,
    onApproved = () => {},
    onFinal = () => {},
    onNetworkError = () => {},
    interval = 5000,
    now = () => Date.now(),
  }) {
    this.#client = client;
    this.#onApproved = onApproved;
    this.#onFinal = onFinal;
    this.#onNetworkError = onNetworkError;
    this.#interval = interval;
    this.#now = now;
  }

  /**
   * Starts polling a request, stopping any previous run first.
   *
   * @param {object} request authorization request data
   * @param {string} request.uuid request identifier
   * @param {string} request.pollToken secret poll token (kept in memory only)
   * @param {string} request.expiresAt ISO-8601 expiration timestamp
   * @returns {void}
   */
  start({ uuid, pollToken, expiresAt }) {
    this.stop();

    const run = { uuid, pollToken, expiresAt: Date.parse(expiresAt) };

    this.#run = run;
    this.#failing = false;

    if (!Number.isNaN(run.expiresAt)) {
      const delay = Math.max(0, run.expiresAt - this.#now());
      this.#expiryTimer = setTimeout(() => this.#expire(run), delay);
    }

    this.#schedule(run);
  }

  /**
   * Stops polling. Safe to call multiple times.
   *
   * @returns {void}
   */
  stop() {
    clearTimeout(this.#pollTimer);
    clearTimeout(this.#expiryTimer);
    this.#pollTimer = null;
    this.#expiryTimer = null;
    this.#run = null;
  }

  /**
   * Tells whether a run is in progress.
   *
   * @returns {boolean} true while polling
   */
  isRunning() {
    return this.#run !== null;
  }

  /**
   * Checks whether the given run is still the active one.
   *
   * @param {object} run run to check
   * @returns {boolean} true when the run is active
   */
  #isActive(run) {
    return this.#run === run;
  }

  /**
   * Schedules the next poll for a run.
   *
   * @param {object} run active run
   * @returns {void}
   */
  #schedule(run) {
    if (!this.#isActive(run)) return;

    this.#pollTimer = setTimeout(() => this.#poll(run), this.#interval);
  }

  /**
   * Ends the run as expired.
   *
   * @param {object} run active run
   * @returns {void}
   */
  #expire(run) {
    this.#finish(run, () => this.#onFinal('expired'));
  }

  /**
   * Stops the run and invokes a callback, unless the run is no longer active.
   *
   * @param {object} run active run
   * @param {Function} callback callback to invoke after stopping
   * @returns {void}
   */
  #finish(run, callback) {
    if (!this.#isActive(run)) return;

    this.stop();
    callback();
  }

  /**
   * Performs a single poll.
   *
   * @param {object} run active run
   * @returns {Promise<void>} resolves once the poll has been handled
   */
  async #poll(run) {
    if (!this.#isActive(run)) return;

    if (!Number.isNaN(run.expiresAt) && this.#now() >= run.expiresAt) {
      this.#expire(run);
      return;
    }

    const result = await this.#fetchStatus(run);

    if (!this.#isActive(run)) return;

    this.#handleResult(run, result);
  }

  /**
   * Requests the current status of the run's authorization request.
   *
   * @param {object} run active run
   * @returns {Promise<string|null>} the status, `notFound` on 404, or null on failure
   */
  async #fetchStatus(run) {
    try {
      const response = await this.#client.poll(run.uuid, run.pollToken);

      if (response.status === 404) return 'notFound';
      if (!response.ok) return null;

      const body = await response.json();

      return body?.status ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Reacts to a poll result.
   *
   * @param {object} run active run
   * @param {string|null} status poll result
   * @returns {void}
   */
  #handleResult(run, status) {
    if (status === 'approved') {
      this.#finish(run, () => this.#onApproved());
    } else if (status === 'notFound' || FINAL_STATUSES.includes(status)) {
      this.#finish(run, () => this.#onFinal(status));
    } else if (status === 'open') {
      this.#setFailing(false);
      this.#schedule(run);
    } else {
      this.#setFailing(true);
      this.#schedule(run);
    }
  }

  /**
   * Updates the failing state, notifying when polling starts failing or recovers.
   *
   * @param {boolean} failing whether the last poll failed
   * @returns {void}
   */
  #setFailing(failing) {
    if (failing) {
      this.#failing = true;
      this.#onNetworkError(true);
    } else if (this.#failing) {
      this.#failing = false;
      this.#onNetworkError(false);
    }
  }
}
