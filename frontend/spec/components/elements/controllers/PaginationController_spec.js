import PaginationController from '../../../../assets/js/components/elements/controllers/PaginationController.js';

describe('PaginationController', function() {
  it('returns a single page when there is only one page', function() {
    const pageList = new PaginationController(1, 1).buildPageList();

    expect(pageList).toEqual([1]);
  });

  it('returns all pages when there are only two pages', function() {
    const pageList = new PaginationController(1, 2).buildPageList();

    expect(pageList).toEqual([1, 2]);
  });

  it('builds pages near the start without duplicate links', function() {
    const pageList = new PaginationController(2, 20).buildPageList();

    expect(pageList).toEqual([1, 2, 3, 4, 5, null, 18, 19, 20]);
  });

  it('builds pages near the end without duplicate links', function() {
    const pageList = new PaginationController(19, 20).buildPageList();

    expect(pageList).toEqual([1, 2, 3, null, 16, 17, 18, 19, 20]);
  });

  it('builds pages in the middle with leading and trailing gaps', function() {
    const pageList = new PaginationController(10, 20).buildPageList();

    expect(pageList).toEqual([1, 2, 3, null, 7, 8, 9, 10, 11, 12, 13, null, 18, 19, 20]);
  });
});
