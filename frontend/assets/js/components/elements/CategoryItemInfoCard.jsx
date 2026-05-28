import React from 'react';

/**
 * Shared card shell for category item info sections.
 *
 * @param {Object} props component props
 * @param {string} props.name item name shown in the card header
 * @param {React.ReactNode} props.children card body content
 * @returns {JSX.Element} info card layout
 */
export default function CategoryItemInfoCard({ name, children }) {
  return (
    <div className='card shadow-sm mb-4'>
      <div className='card-header'>{name}</div>
      <div className='card-body'>
        {children}
      </div>
    </div>
  );
}
