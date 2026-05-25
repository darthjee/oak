import React from 'react';
import OptionalImage from './OptionalImage.jsx';

export default function CatalogCard({ href, title, imageSrc, imageAlt, footer }) {
  return (
    <div className='col-sm-6 col-md-4 col-lg-3 mb-4'>
      <div className='card h-100'>
        <a href={href} className='text-decoration-none text-dark'>
          <div className='card-body'>
            <h5 className='card-title'>{title}</h5>
            <OptionalImage src={imageSrc} alt={imageAlt || title} />
          </div>
        </a>
        {footer}
      </div>
    </div>
  );
}
