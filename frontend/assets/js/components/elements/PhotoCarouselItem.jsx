import React from 'react';
import Carousel from 'react-bootstrap/cjs/Carousel.js';

/**
 * Renders a single photo item in the category item carousel.
 *
 * @param {Object} props component props
 * @param {Object} props.photo photo object
 * @param {string} props.name item name for image alt
 * @returns {JSX.Element} single carousel item
 */
export default function PhotoCarouselItem({ photo, name, ...props }) {
  return (
    <Carousel.Item {...props}>
      <img
        className='d-block w-100'
        src={photo.photo_url}
        alt={name}
      />
    </Carousel.Item>
  );
}
