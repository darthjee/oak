import React from 'react';
import PaginationController from '../controllers/PaginationController.js';
import PageLink from '../PageLink.jsx';

export default class PaginationHelper {
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

  static #normalizePagination(currentPage, totalPages, perPage) {
    const pages = this.#normalizePositiveInteger(totalPages, 1);
    const page = this.#clamp(this.#normalizePositiveInteger(currentPage, 1), 1, pages);
    const itemsPerPage = this.#normalizePositiveInteger(perPage, 10);

    return { page, totalPages: pages, itemsPerPage };
  }

  static #normalizePositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed) || parsed < 1) {
      return fallback;
    }

    return parsed;
  }

  static #clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  static #buildPageLinkTemplate(basePath) {
    return `${basePath}?page=:page&per_page=:perPage`;
  }

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

  static #renderPageEntry(entry, index, currentPage, perPage, linkTemplate) {
    if (entry === null) {
      return this.#renderGapEntry(index);
    }

    const activeClass = entry === currentPage ? ' active' : '';

    return this.#renderNumberedEntry(entry, activeClass, perPage, linkTemplate);
  }

  static #renderDisabledNavigationButton(symbol) {
    return (
      <li className='page-item disabled' aria-disabled='true'>
        <span className='page-link' aria-hidden='true'>{symbol}</span>
      </li>
    );
  }

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

  static #renderGapEntry(index) {
    return (
      <li key={`gap-${index}`} className='page-item disabled' aria-disabled='true'>
        <span className='page-link'>…</span>
      </li>
    );
  }

  static #renderNumberedEntry(entry, activeClass, perPage, linkTemplate) {
    return (
      <li key={`page-${entry}`} className={`page-item${activeClass}`}>
        <PageLink urlTemplate={linkTemplate} page={entry} perPage={perPage}>{entry}</PageLink>
      </li>
    );
  }

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
