import React from 'react';

/**
 * Renders an image only when `src` is present.
 *
 * @param {{src?: string, alt?: string, className?: string}} props image attributes
 * @returns {JSX.Element|null} image element or `null`
 */
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
