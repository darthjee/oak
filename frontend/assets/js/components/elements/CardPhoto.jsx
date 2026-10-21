import React from 'react';

/**
 * Renders a card photo inside a fixed square box, so every card shows the same photo area.
 *
 * The box is always rendered; the image is rendered only when `src` is present.
 *
 * @param {{src?: string, alt?: string}} props image attributes
 * @returns {JSX.Element} photo box markup
 */
export default function CardPhoto({ src, alt }) {
  return (
    <div className='card-img-top ratio ratio-1x1 bg-body-secondary overflow-hidden'>
      {src && <img src={src} alt={alt} className='object-fit-cover' />}
    </div>
  );
}
