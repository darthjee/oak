export default class PaginationBuilder {
  constructor(currentPage, totalPages) {
    this.currentPage = currentPage;
    this.totalPages = totalPages;
    this.pages = new Set();
  }

  addFirstPages() {
    return this.#addRange(1, 3);
  }

  addLastPages() {
    return this.#addRange(this.totalPages - 2, this.totalPages);
  }

  addCurrentPageWindow() {
    return this.#addRange(this.currentPage - 3, this.currentPage + 3);
  }

  build() {
    const sortedPages = [...this.pages].sort((left, right) => left - right);

    return this.#withGaps(sortedPages);
  }

  #addRange(start, finish) {
    for (let page = start; page <= finish; page += 1) {
      this.#addPage(page);
    }

    return this;
  }

  #addPage(page) {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.pages.add(page);
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
