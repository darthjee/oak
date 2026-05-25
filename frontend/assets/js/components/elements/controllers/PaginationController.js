import PaginationBuilder from './PaginationBuilder.js';

/**
 * Builds the page list representation used by the pagination view.
 */
export default class PaginationController {
  constructor(currentPage, totalPages) {
    this.currentPage = currentPage;
    this.totalPages = totalPages;
  }

  /** Returns the final page list with pages and gap markers (`null`). */
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
