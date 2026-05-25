import React from 'react';
import Carousel from 'react-bootstrap/Carousel';

/**
 * Renders category item photos in a carousel.
 *
 * @param {Object} props component props
 * @param {Array<Object>} props.photos photo list
 * @param {string} props.name item name for image alt
 * @returns {JSX.Element|null} photo carousel or null when no photos
 */
export default function PhotosCarousel({ photos, name }) {
  if (!Array.isArray(photos) || photos.length === 0) {
    return null;
  }

  return (
    <div className='mb-4'>
      <h5>Photos</h5>
      <Carousel>
        {photos.map((photo) => (
          <Carousel.Item key={photo.photo_url}>
            <img
              className='d-block w-100'
              src={photo.photo_url}
              alt={name}
            />
          </Carousel.Item>
        ))}
      </Carousel>
    </div>
  );
}
