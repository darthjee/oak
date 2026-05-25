import React from 'react';

/**
 * Renders a paragraph with a strong label and text value.
 *
 * @param {Object} props component props
 * @param {string} props.label paragraph label
 * @param {string} props.value paragraph value
 * @returns {JSX.Element} labeled paragraph
 */
export default function LabelValueParagraph({ label, value }) {
  return (
    <p className='mb-2'>
      <strong>{`${label}:`}</strong>
      {' '}
      {value}
    </p>
  );
}
