import React from 'react';
import Alert from './Alert.jsx';

/**
 * Renders a standard page error container.
 *
 * @param {{error: string}} props error details
 * @returns {JSX.Element} error alert container
 */
export default function ErrorContainer({ error }) {
  return (
    <div className='container mt-4'>
      <Alert message={`Error: ${error}`} />
    </div>
  );
}
