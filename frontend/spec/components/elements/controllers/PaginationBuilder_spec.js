import PaginationBuilder from '../../../../assets/js/components/elements/controllers/PaginationBuilder.js';

describe('PaginationBuilder', function() {
  describe('#addFirstPages', function() {
    it('adds pages 1 through 3', function() {
      const builder = new PaginationBuilder(10, 20);

      builder.addFirstPages();

      expect(builder.build()).toContain(1);
      expect(builder.build()).toContain(2);
      expect(builder.build()).toContain(3);
    });

    it('does not add pages beyond the total when total is small', function() {
      const builder = new PaginationBuilder(1, 2);

      builder.addFirstPages();

      expect(builder.build()).toEqual([1, 2]);
    });
  });

  describe('#addLastPages', function() {
    it('adds the last three pages', function() {
      const builder = new PaginationBuilder(10, 20);

      builder.addLastPages();

      expect(builder.build()).toContain(18);
      expect(builder.build()).toContain(19);
      expect(builder.build()).toContain(20);
    });

    it('does not add pages below 1 when total is small', function() {
      const builder = new PaginationBuilder(1, 2);

      builder.addLastPages();

      expect(builder.build()).toEqual([1, 2]);
    });
  });

  describe('#addCurrentPageWindow', function() {
    it('adds a window of pages around the current page', function() {
      const builder = new PaginationBuilder(10, 20);

      builder.addCurrentPageWindow();

      expect(builder.build()).toContain(7);
      expect(builder.build()).toContain(10);
      expect(builder.build()).toContain(13);
    });

    it('clamps the window to valid page bounds', function() {
      const builder = new PaginationBuilder(2, 20);

      builder.addCurrentPageWindow();

      expect(builder.build()).toEqual([1, 2, 3, 4, 5]);
    });

    it('filters out pages above the total near the end', function() {
      const builder = new PaginationBuilder(19, 20);

      builder.addCurrentPageWindow();

      expect(builder.build()).toEqual([16, 17, 18, 19, 20]);
    });
  });

  describe('#build', function() {
    it('returns an empty array when no pages have been added', function() {
      const builder = new PaginationBuilder(1, 10);

      expect(builder.build()).toEqual([]);
    });

    it('returns sorted pages with null gap markers between non-consecutive pages', function() {
      const builder = new PaginationBuilder(10, 20);

      builder.addFirstPages();
      builder.addLastPages();

      expect(builder.build()).toEqual([1, 2, 3, null, 18, 19, 20]);
    });

    it('returns consecutive pages without gap markers', function() {
      const builder = new PaginationBuilder(1, 5);

      builder.addFirstPages();
      builder.addLastPages();

      expect(builder.build()).toEqual([1, 2, 3, 4, 5]);
    });

    it('does not include duplicate pages', function() {
      const builder = new PaginationBuilder(3, 5);

      builder.addFirstPages();
      builder.addLastPages();
      builder.addCurrentPageWindow();

      expect(builder.build()).toEqual([1, 2, 3, 4, 5]);
    });

    it('returns sorted pages regardless of insertion order', function() {
      const builder = new PaginationBuilder(10, 20);

      builder.addLastPages();
      builder.addCurrentPageWindow();
      builder.addFirstPages();

      expect(builder.build()).toEqual([1, 2, 3, null, 7, 8, 9, 10, 11, 12, 13, null, 18, 19, 20]);
    });
  });
});
