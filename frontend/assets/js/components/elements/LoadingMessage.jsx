import React from 'react';

/**
 * Renders a standard page loading message.
 *
 * @param {Object} props component props
 * @param {string} props.message loading text
 * @returns {JSX.Element} loading message container
 */
export default function LoadingMessage({ message }) {
  return (
    <div className='container mt-4'>
      <p className='text-muted'>{message}</p>
    </div>
  );
}
