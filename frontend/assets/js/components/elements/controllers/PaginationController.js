export default class PaginationController {
  constructor(currentPage, totalPages) {
    this.currentPage = currentPage;
    this.totalPages = totalPages;
  }

  buildPageList() {
    if (this.totalPages <= 0) {
      return [];
    }

    const pages = new Set();

    this.#addRange(pages, 1, 3);
    this.#addRange(pages, this.totalPages - 2, this.totalPages);
    this.#addRange(pages, this.currentPage - 3, this.currentPage + 3);

    const sortedPages = [...pages].sort((left, right) => left - right);

    return this.#withGaps(sortedPages);
  }

  #addRange(pages, start, finish) {
    for (let page = start; page <= finish; page += 1) {
      this.#addPage(pages, page);
    }
  }

  #addPage(pages, page) {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    pages.add(page);
  }

  #withGaps(sortedPages) {
    if (sortedPages.length === 0) {
      return [];
    }

    const list = [sortedPages[0]];

    for (let index = 1; index < sortedPages.length; index += 1) {
      const page = sortedPages[index];
      const previous = sortedPages[index - 1];

      if (page - previous > 1) {
        list.push(null);
      }

      list.push(page);
    }

    return list;
  }
}
