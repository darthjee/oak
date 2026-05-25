import React from 'react';

/**
 * Renders a single category item link.
 *
 * @param {Object} props component props
 * @param {Object} props.link link object
 * @returns {JSX.Element} link list item
 */
export default function CategoryItemLink({ link }) {
  return (
    <li className='list-group-item'>
      <a href={link.url} target='_blank' rel='noreferrer'>
        {link.text || link.url}
      </a>
    </li>
  );
}
