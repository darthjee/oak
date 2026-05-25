import PaginationHelper from './helpers/PaginationHelper.jsx';

/**
 * Pagination component that renders navigation controls for paged content.
 *
 * @param {Object} props component props
 * @param {number} props.currentPage currently active page number
 * @param {number} props.totalPages total number of available pages
 * @param {number} props.perPage number of items displayed per page
 * @param {string} props.basePath base URL path used to build page links
 * @returns {JSX.Element|null} pagination navigation or `null` when not needed
 */
export default function Pagination({ currentPage, totalPages, perPage, basePath }) {
  return PaginationHelper.render(currentPage, totalPages, perPage, basePath);
}
