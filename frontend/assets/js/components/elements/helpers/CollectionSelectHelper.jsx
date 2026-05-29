import React from 'react';

/**
 * Renders reusable pieces for CollectionSelect.
 */
export default class CollectionSelectHelper {
  /**
   * Renders an array of option elements from a collection.
   *
   * @param {Array<Object>} collection items to render as options
   * @param {string} keyColumn property used as the option value and React key
   * @param {string} labelColumn property used as the option display text
   * @returns {JSX.Element[]} array of option elements
   */
  static renderOptions(collection, keyColumn, labelColumn) {
    return collection.map((item) => (
      <option key={item[keyColumn]} value={item[keyColumn]}>
        {item[labelColumn]}
      </option>
    ));
  }
}
