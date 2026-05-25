import React from 'react';

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
          <li key={link.id} className='list-group-item'>
            <a href={link.url} target='_blank' rel='noreferrer'>
              {link.text || link.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
