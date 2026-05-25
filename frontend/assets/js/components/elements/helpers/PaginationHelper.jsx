import React from 'react';
import PaginationController from '../controllers/PaginationController.js';
import PageLink from '../PageLink.jsx';

/**
 * Renders the pagination UI from raw pagination data.
 */
export default class PaginationHelper {
  /** Normalizes pagination values and returns the full pagination component markup. */
  static render(currentPage, totalPages, perPage, basePath) {
    const normalizedPagination = this.#normalizePagination(currentPage, totalPages, perPage);

    if (normalizedPagination.totalPages <= 1) {
      return null;
    }

    const { page, totalPages: pages, itemsPerPage } = normalizedPagination;
    const pageList = new PaginationController(page, pages).buildPageList();

    return this.#renderPaginationContainer(
      pageList,
      page,
      pages,
      itemsPerPage,
      basePath
    );
  }

  /** Coerces incoming values to valid pagination values. */
  static #normalizePagination(currentPage, totalPages, perPage) {
    const pages = this.#normalizePositiveInteger(totalPages, 1);
    const page = this.#clamp(this.#normalizePositiveInteger(currentPage, 1), 1, pages);
    const itemsPerPage = this.#normalizePositiveInteger(perPage, 10);

    return { page, totalPages: pages, itemsPerPage };
  }

  /** Parses a positive integer value or returns the provided fallback. */
  static #normalizePositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed) || parsed < 1) {
      return fallback;
    }

    return parsed;
  }

  /** Clamps a number between `min` and `max`. */
  static #clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /** Builds a page URL template consumed by `PageLink`. */
  static #buildPageLinkTemplate(basePath) {
    return `${basePath}?page=:page&per_page=:perPage`;
  }

  /** Renders the previous-page button, disabled on the first page. */
  static #renderPreviousButton(currentPage, perPage, linkTemplate) {
    if (currentPage <= 1) {
      return this.#renderDisabledNavigationButton('«');
    }

    return this.#renderNavigationButton(
      currentPage - 1,
      perPage,
      linkTemplate,
      'Previous',
      '«'
    );
  }

  /** Renders the next-page button, disabled on the last page. */
  static #renderNextButton(currentPage, totalPages, perPage, linkTemplate) {
    if (currentPage >= totalPages) {
      return this.#renderDisabledNavigationButton('»');
    }

    return this.#renderNavigationButton(
      currentPage + 1,
      perPage,
      linkTemplate,
      'Next',
      '»'
    );
  }

  /** Renders either a page entry or an ellipsis gap entry. */
  static #renderPageEntry(entry, index, currentPage, perPage, linkTemplate) {
    if (entry === null) {
      return this.#renderGapEntry(index);
    }

    const activeClass = entry === currentPage ? ' active' : '';

    return this.#renderNumberedEntry(entry, activeClass, perPage, linkTemplate);
  }

  /** Renders a disabled navigation button. */
  static #renderDisabledNavigationButton(symbol) {
    return (
      <li className='page-item disabled' aria-disabled='true'>
        <span className='page-link' aria-hidden='true'>{symbol}</span>
      </li>
    );
  }

  /** Renders a navigation button wrapped by `PageLink`. */
  static #renderNavigationButton(page, perPage, linkTemplate, ariaLabel, symbol) {
    return (
      <li className='page-item'>
        <PageLink
          urlTemplate={linkTemplate}
          page={page}
          perPage={perPage}
          ariaLabel={ariaLabel}
        >
          <span aria-hidden='true'>{symbol}</span>
        </PageLink>
      </li>
    );
  }

  /** Renders an ellipsis entry between non-consecutive pages. */
  static #renderGapEntry(index) {
    return (
      <li key={`gap-${index}`} className='page-item disabled' aria-disabled='true'>
        <span className='page-link'>…</span>
      </li>
    );
  }

  /** Renders a numbered page entry wrapped by `PageLink`. */
  static #renderNumberedEntry(entry, activeClass, perPage, linkTemplate) {
    return (
      <li key={`page-${entry}`} className={`page-item${activeClass}`}>
        <PageLink urlTemplate={linkTemplate} page={entry} perPage={perPage}>{entry}</PageLink>
      </li>
    );
  }

  /** Renders the full pagination navigation container. */
  static #renderPaginationContainer(pageList, page, totalPages, itemsPerPage, basePath) {
    const linkTemplate = this.#buildPageLinkTemplate(basePath);

    return (
      <nav aria-label='Categories pages' className='mt-4'>
        <ul className='pagination justify-content-center'>
          {this.#renderPreviousButton(page, itemsPerPage, linkTemplate)}
          {pageList.map((entry, index) => this.#renderPageEntry(entry, index, page, itemsPerPage, linkTemplate))}
          {this.#renderNextButton(page, totalPages, itemsPerPage, linkTemplate)}
        </ul>
      </nav>
    );
  }
}
