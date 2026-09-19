import React from 'react';
import Carousel from 'react-bootstrap/cjs/Carousel.js';
import ErrorContainer from './ErrorContainer.jsx';

/**
 * Renders a single photo item in the category item carousel.
 *
 * @param {Object} props component props
 * @param {Object} props.photo photo object
 * @param {string} props.name item name for image alt
 * @param {Function} [props.onDelete] callback() invoked once the user confirms deletion;
 *   when omitted, no delete button is rendered
 * @param {boolean} [props.deleting] whether a delete request for this photo is in flight
 * @param {string|null} [props.error] delete error message for this photo, when present
 * @returns {JSX.Element} single carousel item
 */
export default function PhotoCarouselItem({ photo, name, onDelete, deleting = false, error = null, ...props }) {
  const handleDeleteClick = () => {
    if (window.confirm('Delete this photo?')) {
      onDelete();
    }
  };

  return (
    <Carousel.Item {...props}>
      <img
        className='d-block w-100'
        src={photo.photo_url}
        alt={name}
      />
      {onDelete && (
        <button
          className='btn btn-outline-danger'
          disabled={deleting}
          onClick={handleDeleteClick}
          type='button'
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      )}
      {error && <ErrorContainer error={error} />}
    </Carousel.Item>
  );
}
