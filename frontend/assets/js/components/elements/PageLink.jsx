import React from 'react';

/**
 * Generic pagination link renderer based on a URL template.
 *
 * @param {Object} props component props
 * @param {string} props.urlTemplate URL template containing `:page` and `:perPage`
 * @param {number} props.page page number used in URL replacement
 * @param {number} props.perPage items per page used in URL replacement
 * @param {string|undefined} [props.ariaLabel=undefined] optional aria label
 * @param {React.ReactNode} props.children element content
 * @returns {JSX.Element} page anchor element
 */
export default function PageLink({
  urlTemplate,
  page,
  perPage,
  ariaLabel = undefined,
  children,
}) {
  return (
    <a
      className='page-link'
      href={urlTemplate.replace(':page', page).replace(':perPage', perPage)}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
