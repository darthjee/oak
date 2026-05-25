import React from 'react';

export default function OptionalImage({ src, alt, className = 'img-fluid' }) {
  if (!src) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
    />
  );
}
