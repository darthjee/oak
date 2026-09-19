import React from 'react';
import Carousel from 'react-bootstrap/cjs/Carousel.js';
import PhotoCarouselItem from './PhotoCarouselItem.jsx';

/**
 * Renders category item photos in a carousel.
 *
 * @param {Object} props component props
 * @param {Array<Object>} props.photos photo list
 * @param {string} props.name item name for image alt
 * @param {Function} [props.onDeletePhoto] callback(photoId) invoked once the user confirms
 *   deleting a photo; when omitted, no delete button is rendered for any photo
 * @param {number|string|null} [props.deletingPhotoId] id of the photo currently being deleted,
 *   if any
 * @param {Object} [props.deleteErrorByPhotoId] map of photo id to delete error message
 * @returns {JSX.Element|null} photo carousel or null when no photos
 */
export default function PhotosCarousel({ photos, name, onDeletePhoto, deletingPhotoId, deleteErrorByPhotoId }) {
  if (!Array.isArray(photos) || photos.length === 0) {
    return null;
  }

  return (
    <div className='mb-4'>
      <h5>Photos</h5>
      <Carousel>
        {photos.map((photo) => (
          <PhotoCarouselItem
            key={photo.photo_url}
            photo={photo}
            name={name}
            onDelete={onDeletePhoto ? () => onDeletePhoto(photo.id) : undefined}
            deleting={deletingPhotoId === photo.id}
            error={deleteErrorByPhotoId?.[photo.id] || null}
          />
        ))}
      </Carousel>
    </div>
  );
}
