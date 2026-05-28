import React from 'react';
import Pagination from '../../elements/Pagination.jsx';

/**
 * Shared pagination for index pages.
 *
 * @param {Object} props component props
 * @param {Object} props.pagination pagination metadata
 * @param {string} props.basePath hash route base path
 * @returns {JSX.Element} pagination controls
 */
export default function PaginationHelper({ pagination, basePath }) {
  return (
    <Pagination
      currentPage={pagination?.page ?? 1}
      totalPages={pagination?.pages ?? 1}
      perPage={pagination?.perPage ?? 10}
      basePath={basePath}
    />
  );
}
