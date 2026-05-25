import PaginationBuilder from './PaginationBuilder.js';

/**
 * Builds the page list representation used by the pagination view.
 */
export default class PaginationController {
  /**
   * Creates a new PaginationController instance.
   *
   * @param {number} currentPage current selected page
   * @param {number} totalPages total number of pages available
   */
  constructor(currentPage, totalPages) {
    this.currentPage = currentPage;
    this.totalPages = totalPages;
  }

  /**
   * Returns the final page list with pages and gap markers (`null`).
   *
   * @returns {Array<number|null>} page list for pagination rendering
   */
  buildPageList() {
    if (this.totalPages <= 0) {
      return [];
    }

    return new PaginationBuilder(this.currentPage, this.totalPages)
      .addFirstPages()
      .addLastPages()
      .addCurrentPageWindow()
      .build();
  }
}
