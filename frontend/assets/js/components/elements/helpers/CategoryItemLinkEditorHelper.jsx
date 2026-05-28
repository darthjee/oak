import React from 'react';
import LabeledInput from '../LabeledInput.jsx';

/**
 * Renders reusable pieces for category item link editor.
 */
export default class CategoryItemLinkEditorHelper {
  /**
   * Renders a labeled link input field.
   *
   * @param {number} index link index
   * @param {string} fieldName field name
   * @param {string} value field value
   * @param {Function} onLinkChange callback(index, field, value)
   * @returns {JSX.Element} input field
   */
  static renderLabeledInput(index, fieldName, value, onLinkChange) {
    const label = fieldName === 'url' ? 'URL' : 'Text';
    return (
      <LabeledInput
        id={`link-${fieldName}-${index}`}
        label={label}
        value={value || ''}
        onChange={this.#buildLinkFieldHandler(onLinkChange, index, fieldName)}
      />
    );
  }

  /**
   * Renders remove action button.
   *
   * @param {Function} onRemoveLink callback(index)
   * @param {number} index link index
   * @returns {JSX.Element} remove action
   */
  static renderRemoveAction(onRemoveLink, index) {
    return (
      <div className='text-end'>
        <button
          className='btn btn-danger btn-sm'
          onClick={() => onRemoveLink(index)}
          type='button'
        >
          Remove
        </button>
      </div>
    );
  }

  static #buildLinkFieldHandler(onLinkChange, index, field) {
    return (event) => onLinkChange(index, field, event.target.value);
  }
}
