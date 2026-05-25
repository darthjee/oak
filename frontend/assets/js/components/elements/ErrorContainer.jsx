import React from 'react';
import Alert from './Alert.jsx';

export default function ErrorContainer({ error }) {
  return (
    <div className='container mt-4'>
      <Alert message={`Error: ${error}`} />
    </div>
  );
}
