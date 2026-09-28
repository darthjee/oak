import React from 'react';
import Alert from '../../elements/Alert.jsx';

const BUTTON_LABELS = {
  idle: 'Start',
  running: 'Stop',
  stopping: 'Stopping…',
  done: 'Done',
  stopped: 'Stopped',
  noProgress: 'Finished',
  error: 'Failed',
};

/**
 * Renders the photo migration page HTML for different states.
 */
export default class PhotoMigrationHelper {
  /**
   * Renders the page for a visitor who is not logged in.
   *
   * @returns {JSX.Element} info message asking the user to log in, without a button
   */
  static renderLoggedOut() {
    return (
      <div className='container mt-4'>
        <h1>Photo migration</h1>
        <Alert message='Please log in to migrate your photos.' variant='info' />
      </div>
    );
  }

  /**
   * Renders the photo migration page.
   *
   * @param {string} status loop status (`idle`, `running`, `stopping`, `done`, `stopped`, `noProgress`, `error`)
   * @param {{migrated: number, missing: number[], failed: Array<{id: number, reason: string}>, remaining: (number|null)}} totals
   *   accumulated totals
   * @param {string|null} error error message, shown when status is `error`
   * @param {{onStart: Function, onStop: Function}} handlers button callbacks
   * @returns {JSX.Element} photo migration page content
   */
  static render(status, totals, error, { onStart, onStop }) {
    return (
      <div className='container mt-4'>
        <h1>Photo migration</h1>
        <p>
          Moves your legacy photos to the new storage, one batch at a time,
          until nothing is left.
        </p>
        {this.#renderButton(status, onStart, onStop)}
        {this.#renderProgress(totals)}
        {this.#renderStatusMessage(status, totals, error)}
        {this.#renderMissing(totals.missing)}
        {this.#renderFailed(totals.failed)}
      </div>
    );
  }

  /**
   * Returns the button label for a given status.
   *
   * @param {string} status loop status
   * @returns {string} button label
   */
  static buttonLabel(status) {
    return BUTTON_LABELS[status] || 'Start';
  }

  static #renderButton(status, onStart, onStop) {
    const isIdle = status === 'idle';
    const isRunning = status === 'running';
    const className = isRunning ? 'btn btn-danger' : 'btn btn-primary';
    const onClick = isRunning ? onStop : onStart;

    return (
      <div className='mb-3'>
        <button
          className={className}
          disabled={!isIdle && !isRunning}
          onClick={onClick}
          type='button'
        >
          {this.buttonLabel(status)}
        </button>
      </div>
    );
  }

  static #renderProgress(totals) {
    return (
      <ul className='list-unstyled mb-3 photo-migration-progress'>
        <li>Migrated: {totals.migrated}</li>
        {totals.remaining === null || totals.remaining === undefined
          ? null
          : <li>Remaining: {totals.remaining}</li>}
        <li>Missing: {totals.missing.length}</li>
        <li>Failed: {totals.failed.length}</li>
      </ul>
    );
  }

  static #renderStatusMessage(status, totals, error) {
    switch (status) {
    case 'done':
      return <Alert message='All photos migrated.' variant='success' />;
    case 'stopped':
      return <Alert message='Stopped.' variant='secondary' />;
    case 'noProgress':
      return this.#renderNoProgress(totals);
    case 'error':
      return <Alert message={error || 'Migration request failed.'} />;
    default:
      return null;
    }
  }

  static #renderNoProgress(totals) {
    if (!totals.remaining) {
      return <Alert message='No more photos could be migrated.' variant='secondary' />;
    }

    return (
      <Alert
        message={
          `${totals.remaining} photos could not be migrated now (see failures); ` +
          'try again in a few minutes.'
        }
        variant='warning'
      />
    );
  }

  static #renderMissing(missing) {
    if (!missing.length) {
      return null;
    }

    return (
      <div className='mb-3 photo-migration-missing'>
        <h2 className='h5'>Missing photos</h2>
        <ul>
          {missing.map((id) => <li key={`missing-${id}`}>#{id}</li>)}
        </ul>
      </div>
    );
  }

  static #renderFailed(failed) {
    if (!failed.length) {
      return null;
    }

    return (
      <div className='mb-3 photo-migration-failed'>
        <h2 className='h5'>Failed photos</h2>
        <ul>
          {failed.map((failure, index) => (
            <li key={`failed-${failure.id}-${index}`}>#{failure.id} — {failure.reason}</li>
          ))}
        </ul>
      </div>
    );
  }
}
