import React from 'react';
import Pagination from '../../elements/Pagination.jsx';

/**
 * Renders shared pagination for index pages.
 */
export default class PaginationHelper {
  /**
   * Renders pagination controls for a list page.
   *
   * @param {Object} pagination pagination metadata
   * @param {string} basePath hash route base path
   * @returns {JSX.Element} pagination controls
   */
  static render(pagination, basePath) {
    return (
      <Pagination
        currentPage={pagination?.page ?? 1}
        totalPages={pagination?.pages ?? 1}
        perPage={pagination?.perPage ?? 10}
        basePath={basePath}
      />
    );
  }
}
