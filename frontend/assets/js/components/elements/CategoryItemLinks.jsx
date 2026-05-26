import React from 'react';
import CategoryItemLink from './CategoryItemLink.jsx';

/**
 * Renders category item links section.
 *
 * @param {Object} props component props
 * @param {Array<Object>} props.links links to render
 * @returns {JSX.Element|null} links section or null when no links
 */
export default function CategoryItemLinks({ links }) {
  if (!Array.isArray(links) || links.length === 0) {
    return null;
  }

  return (
    <div className='mb-4'>
      <h5>Links</h5>
      <ul className='list-group'>
        {links.map((link) => (
          <CategoryItemLink key={link.id} link={link} />
        ))}
      </ul>
    </div>
  );
}
