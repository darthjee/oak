import React from 'react';

/**
 * Renders the common back/action button group for page headers.
 *
 * @param {Object} props component props
 * @param {string} props.backHref back destination
 * @param {string|null} props.actionHref primary action destination
 * @param {string|null} props.actionLabel primary action label
 * @returns {JSX.Element} action buttons
 */
export default function PageActions({ backHref, actionHref, actionLabel }) {
  return (
    <div className='mb-3'>
      <a className='btn btn-outline-secondary me-2' href={backHref}>
        Back
      </a>
      {actionHref && actionLabel ? (
        <a className='btn btn-primary' href={actionHref}>
          {actionLabel}
        </a>
      ) : null}
    </div>
  );
}
