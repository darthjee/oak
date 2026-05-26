import React from 'react';

/**
 * Renders a standard catalog list container.
 *
 * @param {{children: React.ReactNode}} props component props
 * @returns {JSX.Element} list wrapper markup
 */
export default function CatalogList({ children }) {
  return (
    <div className='container mt-4'>
      <div className='row'>
        {children}
      </div>
    </div>
  );
}
