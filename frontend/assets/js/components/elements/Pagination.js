import PaginationHelper from './helpers/PaginationHelper.js';

export default function Pagination({ currentPage, totalPages, perPage, basePath }) {
  return PaginationHelper.render(currentPage, totalPages, perPage, basePath);
}
