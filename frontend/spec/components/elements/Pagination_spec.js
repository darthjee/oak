import Pagination from '../../../assets/js/components/elements/Pagination.js';
import PaginationHelper from '../../../assets/js/components/elements/helpers/PaginationHelper.js';

describe('Pagination', function() {
  it('delegates rendering to PaginationHelper', function() {
    const expectedResult = Symbol('rendered-pagination');
    spyOn(PaginationHelper, 'render').and.returnValue(expectedResult);

    const result = Pagination({
      currentPage: 2,
      totalPages: 9,
      perPage: 20,
      basePath: '/#/categories',
    });

    expect(PaginationHelper.render).toHaveBeenCalledWith(2, 9, 20, '/#/categories');
    expect(result).toBe(expectedResult);
  });
});
