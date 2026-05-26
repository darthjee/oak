import React from 'react';

/**
 * Renders a label and input pair inside a form-group wrapper.
 *
 * @param {{label: string, id: string, wrapperClassName?: string, className?: string}} props component props
 * @returns {JSX.Element} rendered labeled input
 */
export default function LabeledInput({
  label,
  id,
  wrapperClassName = 'mb-3',
  className = 'form-control',
  ...inputProps
}) {
  return (
    <div className={wrapperClassName}>
      <label className='form-label' htmlFor={id}>
        {label}
      </label>
      <input id={id} className={className} {...inputProps} />
    </div>
  );
}
