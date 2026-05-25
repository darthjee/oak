import React from 'react';

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
