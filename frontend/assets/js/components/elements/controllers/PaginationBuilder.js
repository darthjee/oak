/**
 * Builds a sparse page list for pagination, inserting `null` entries for gaps.
 */
export default class PaginationBuilder {
  /**
   * Creates a new PaginationBuilder instance.
   *
   * @param {number} currentPage current selected page
   * @param {number} totalPages total number of pages available
   */
  constructor(currentPage, totalPages) {
    this.currentPage = currentPage;
    this.totalPages = totalPages;
    this.pages = new Set();
  }

  /**
   * Adds the first pages that should always be visible.
   *
   * @returns {PaginationBuilder} current builder instance
   */
  addFirstPages() {
    return this.#addRange(1, 3);
  }

  /**
   * Adds the last pages that should always be visible.
   *
   * @returns {PaginationBuilder} current builder instance
   */
  addLastPages() {
    return this.#addRange(this.totalPages - 2, this.totalPages);
  }

  /**
   * Adds the sliding window around the current page.
   *
   * @returns {PaginationBuilder} current builder instance
   */
  addCurrentPageWindow() {
    return this.#addRange(this.currentPage - 3, this.currentPage + 3);
  }

  /**
   * Returns a sorted page list with `null` placeholders between non-consecutive pages.
   *
   * @returns {Array<number|null>} sorted page list with gap markers
   */
  build() {
    const sortedPages = [...this.pages].sort((left, right) => left - right);

    return this.#withGaps(sortedPages);
  }

  /**
   * Adds an inclusive page range to the internal page set.
   *
   * @param {number} start first page in range
   * @param {number} finish last page in range
   * @returns {PaginationBuilder} current builder instance
   */
  #addRange(start, finish) {
    for (let page = start; page <= finish; page += 1) {
      this.#addPage(page);
    }

    return this;
  }

  /**
   * Adds a page if it is within the valid bounds.
   *
   * @param {number} page page number to add
   * @returns {void}
   */
  #addPage(page) {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.pages.add(page);
  }

  /**
   * Inserts `null` markers where there are jumps between consecutive pages.
   *
   * @param {number[]} sortedPages sorted page list without gaps
   * @returns {Array<number|null>} sorted page list including gap markers
   */
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
