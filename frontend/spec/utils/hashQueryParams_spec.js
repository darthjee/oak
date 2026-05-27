import getHashQueryParams from '../../assets/js/utils/hashQueryParams.js';

describe('getHashQueryParams', function() {
  it('returns empty params when hash has no query params', function() {
    expect(getHashQueryParams('#/categories').toString()).toEqual('');
  });

  it('extracts single query param from hash', function() {
    expect(getHashQueryParams('#/categories?page=2').toString()).toEqual('page=2');
  });

  it('extracts all query params from hash', function() {
    expect(getHashQueryParams('#/categories?page=3&per_page=5').toString()).toEqual('page=3&per_page=5');
  });
});
