import React from 'react';

/**
 * Renders a Bootstrap alert element.
 *
 * @param {{message: string, variant?: string}} props component props
 * @returns {JSX.Element} rendered alert
 */
export default function Alert({ message, variant = 'danger' }) {
  return (
    <div className={`alert alert-${variant}`} role='alert'>
      {message}
    </div>
  );
}
