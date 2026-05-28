import React from 'react';

/**
 * Renders reusable pieces for category item links editor.
 */
export default class CategoryItemLinksEditorHelper {
  /**
   * Renders add-link action button.
   *
   * @param {Function} onAddLink callback()
   * @returns {JSX.Element} add button
   */
  static renderAddLinkButton(onAddLink) {
    return (
      <button className='btn btn-primary btn-sm' onClick={onAddLink} type='button'>
        Add link
      </button>
    );
  }
}
