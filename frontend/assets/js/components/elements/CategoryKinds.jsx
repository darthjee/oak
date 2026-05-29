import React from 'react';

/**
 * Renders category kinds as badges or an empty state message.
 *
 * @param {Object} props component props
 * @param {Array} props.kinds category kinds
 * @returns {JSX.Element} rendered kinds
 */
export default function CategoryKinds({ kinds }) {
  if (!kinds || kinds.length === 0) {
    return <p className='mb-0'>No kinds connected.</p>;
  }

  return (
    <>
      <p className='mb-2'>Kinds</p>
      <div className='d-flex flex-wrap'>
        {kinds.map((kind) => (
          <span key={kind.slug} className='badge text-bg-primary me-2 mb-2'>
            {kind.name}
          </span>
        ))}
      </div>
    </>
  );
}
