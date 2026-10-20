import React from 'react';

/**
 * Renders a Bootstrap checkbox with its label inside a form-check wrapper.
 *
 * @param {{label: string, id: string, checked: boolean, onChange: Function, wrapperClassName?: string}} props component props
 * @returns {JSX.Element} rendered labeled checkbox
 */
export default function LabeledCheckbox({
  label,
  id,
  checked,
  onChange,
  wrapperClassName = 'form-check mb-3',
  ...inputProps
}) {
  return (
    <div className={wrapperClassName}>
      <input
        id={id}
        className='form-check-input'
        type='checkbox'
        checked={Boolean(checked)}
        onChange={onChange}
        {...inputProps}
      />
      <label className='form-check-label' htmlFor={id}>
        {label}
      </label>
    </div>
  );
}
