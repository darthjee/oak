import React from 'react';
import Pagination from '../../elements/Pagination.jsx';

/**
 * Renders shared pagination for index pages.
 */
export default class PaginationHelper {
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
