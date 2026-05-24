import PaginationBuilder from './PaginationBuilder.js';

export default class PaginationController {
  constructor(currentPage, totalPages) {
    this.currentPage = currentPage;
    this.totalPages = totalPages;
  }

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
