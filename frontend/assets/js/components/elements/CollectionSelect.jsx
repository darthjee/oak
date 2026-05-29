import React from 'react';
import CollectionSelectHelper from './helpers/CollectionSelectHelper.jsx';

/**
 * Renders a generic select dropdown backed by a collection of objects.
 *
 * @param {Object} props component props
 * @param {Array<Object>} props.collection items to render as options
 * @param {string} props.keyColumn object property used as the option value and React key
 * @param {string} props.labelColumn object property used as the option display text
 * @param {string} props.selectedValue currently selected value
 * @param {Function} props.onChange callback(value) when selection changes
 * @param {string} [props.id] id attribute for the select element
 * @param {string} [props.placeholder] text shown in the empty default option
 * @param {string} [props.className] CSS class for the select element
 * @returns {JSX.Element} select element
 */
export default function CollectionSelect({
  collection,
  keyColumn,
  labelColumn,
  selectedValue,
  onChange,
  id,
  placeholder = '-- Select --',
  className = 'form-select',
}) {
  return (
    <select
      className={className}
      id={id}
      onChange={(e) => onChange(e.target.value)}
      value={selectedValue}
    >
      <option value=''>{placeholder}</option>
      {CollectionSelectHelper.renderOptions(collection, keyColumn, labelColumn)}
    </select>
  );
}
