import React from 'react';
import Alert from '../../elements/Alert.jsx';
import ErrorContainer from '../../elements/ErrorContainer.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const EMPTY_ROW = Object.freeze({
  formOpen: false,
  password: '',
  error: null,
  submitting: false,
});

const toTime = (value) => (value instanceof Date ? value.getTime() : new Date(value).getTime());

/**
 * Renders the Authorizations (device approver) page HTML for different states.
 */
export default class AuthorizationsHelper {
  /**
   * Formats how long ago a request was created.
   *
   * @param {string|Date} createdAt request creation time
   * @param {Date|number} now reference "current" time
   * @returns {string} "just now", "N min ago" or "N h ago" (empty for invalid dates)
   */
  static formatAge(createdAt, now) {
    const elapsed = toTime(now) - toTime(createdAt);

    if (Number.isNaN(elapsed)) {
      return '';
    }

    if (elapsed < MINUTE) {
      return 'just now';
    }

    if (elapsed < HOUR) {
      return `${Math.floor(elapsed / MINUTE)} min ago`;
    }

    return `${Math.floor(elapsed / HOUR)} h ago`;
  }

  /**
   * Formats how long until a request expires.
   *
   * @param {string|Date} expiresAt request expiry time
   * @param {Date|number} now reference "current" time
   * @returns {string} "Expires in N min", or "Expired" when past (empty for invalid dates)
   */
  static formatExpiry(expiresAt, now) {
    const remaining = toTime(expiresAt) - toTime(now);

    if (Number.isNaN(remaining)) {
      return '';
    }

    if (remaining <= 0) {
      return 'Expired';
    }

    return `Expires in ${Math.ceil(remaining / MINUTE)} min`;
  }

  /**
   * Renders the page in a loading state.
   *
   * @returns {JSX.Element} loading placeholder
   */
  static renderLoading() {
    return <LoadingMessage message='Loading authorization requests...' />;
  }

  /**
   * Renders the Authorizations page.
   *
   * @param {Object} props render options
   * @param {Array<Object>} props.requests open authorization requests
   * @param {string|null} [props.error] page-level error message
   * @param {Object<string, Object>} [props.rows] per-uuid row state
   *   (`{ formOpen, password, error, submitting }`)
   * @param {Date|number} props.now reference time used for age/expiry text
   * @param {Object} props.handlers event handlers
   * @param {Function} props.handlers.onRefresh reloads the list
   * @param {Function} props.handlers.onDeny called with the uuid to deny
   * @param {Function} props.handlers.onOpenAuthorize called with the uuid to open the form for
   * @param {Function} props.handlers.onCancelAuthorize called with the uuid to close the form for
   * @param {Function} props.handlers.onPasswordChange called with the uuid and the new value
   * @param {Function} props.handlers.onConfirm called with the uuid to authorize
   * @returns {JSX.Element} authorizations page
   */
  static render({ requests, error = null, rows = {}, now, handlers }) {
    return (
      <div className='container mt-4 authorizations-page'>
        <h1>Authorizations</h1>
        <Alert
          variant='warning'
          message='Only approve requests you started yourself. Approving a request signs that device in to your account.'
        />
        <div className='mb-3'>
          <button type='button' className='btn btn-outline-secondary' onClick={handlers.onRefresh}>
            Refresh
          </button>
        </div>
        {error ? <ErrorContainer error={error} /> : this.#renderList(requests, rows, now, handlers)}
      </div>
    );
  }

  static #renderList(requests, rows, now, handlers) {
    if (!requests || requests.length === 0) {
      return <p className='text-muted'>No pending requests.</p>;
    }

    return (
      <ul className='list-group'>
        {requests.map((request) => this.#renderRow(
          request, rows[request.uuid] ?? EMPTY_ROW, now, handlers
        ))}
      </ul>
    );
  }

  static #renderRow(request, row, now, handlers) {
    const { uuid, requestIp, requestUserAgent, createdAt, expiresAt, keepSignedIn } = request;

    return (
      <li key={uuid} className='list-group-item authorization-request'>
        <div className='d-flex justify-content-between flex-wrap gap-2'>
          <div>
            <div><strong>IP:</strong> {requestIp}</div>
            <div className='text-break'><strong>User-Agent:</strong> {requestUserAgent}</div>
            <div className='text-muted small'>
              <span>{this.formatAge(createdAt, now)}</span>
              {' · '}
              <span>{this.formatExpiry(expiresAt, now)}</span>
              {keepSignedIn === true && (
                <span className='badge bg-info text-dark ms-2'>Keep signed in</span>
              )}
            </div>
          </div>
          <div className='d-flex align-items-start gap-2'>
            <button
              type='button'
              className='btn btn-outline-danger btn-sm'
              disabled={row.submitting}
              onClick={() => handlers.onDeny(uuid)}
            >
              Deny
            </button>
            {!row.formOpen && (
              <button
                type='button'
                className='btn btn-primary btn-sm'
                disabled={row.submitting}
                onClick={() => handlers.onOpenAuthorize(uuid)}
              >
                Authorize
              </button>
            )}
          </div>
        </div>
        {row.formOpen && this.#renderForm(uuid, row, handlers)}
        {row.error && <div className='text-danger small mt-2'>{row.error}</div>}
      </li>
    );
  }

  static #renderForm(uuid, row, handlers) {
    const inputId = `authorization-password-${uuid}`;
    const onSubmit = (event) => {
      event.preventDefault();
      handlers.onConfirm(uuid);
    };

    return (
      <form className='d-flex align-items-end gap-2 mt-2' onSubmit={onSubmit}>
        <div>
          <label htmlFor={inputId} className='form-label small mb-1'>Password</label>
          <input
            id={inputId}
            type='password'
            className='form-control form-control-sm'
            autoComplete='current-password'
            value={row.password}
            onChange={(event) => handlers.onPasswordChange(uuid, event.target.value)}
          />
        </div>
        <button type='submit' className='btn btn-success btn-sm' disabled={row.submitting}>
          Confirm
        </button>
        <button
          type='button'
          className='btn btn-link btn-sm'
          disabled={row.submitting}
          onClick={() => handlers.onCancelAuthorize(uuid)}
        >
          Cancel
        </button>
      </form>
    );
  }
}
