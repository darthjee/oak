import React from 'react';
import CardPhoto from './CardPhoto.jsx';

/**
 * Renders a standard card with a fixed square photo box and optional footer content.
 *
 * @param {{href: string, title: string, imageSrc?: string, imageAlt?: string, footer?: JSX.Element}} props card attributes
 * @returns {JSX.Element} card markup
 */
export default function CatalogCard({ href, title, imageSrc, imageAlt, footer }) {
  return (
    <div className='col-sm-6 col-md-4 col-lg-3 mb-4'>
      <div className='card h-100'>
        <a href={href} className='text-decoration-none text-dark'>
          <CardPhoto src={imageSrc} alt={imageAlt || title} />
          <div className='card-body'>
            <h5 className='card-title'>{title}</h5>
          </div>
        </a>
        {footer}
      </div>
    </div>
  );
}
