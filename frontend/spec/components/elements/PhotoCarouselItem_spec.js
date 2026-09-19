import { renderToStaticMarkup } from 'react-dom/server';
import PhotoCarouselItem from '../../../assets/js/components/elements/PhotoCarouselItem.jsx';
import { preserveGlobals } from '../../support/factories.js';

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

describe('PhotoCarouselItem', function() {
  it('renders one carousel image item', function() {
    const html = renderToStaticMarkup(
      PhotoCarouselItem({
        photo: { photo_url: 'http://example.com/oak.png' },
        name: 'Oak',
      })
    );

    expect(html).toContain('carousel-item');
    expect(html).toContain('http://example.com/oak.png');
    expect(html).toContain('alt="Oak"');
  });

  it('forwards extra props to Carousel.Item so the active class is applied', function() {
    const html = renderToStaticMarkup(
      PhotoCarouselItem({
        photo: { photo_url: 'http://example.com/oak.png' },
        name: 'Oak',
        className: 'active',
      })
    );

    expect(html).toContain('carousel-item active');
  });

  describe('delete button', function() {
    let restoreGlobals;

    beforeEach(function() {
      restoreGlobals = preserveGlobals('window');
    });

    afterEach(function() {
      restoreGlobals();
    });

    const findDeleteButton = (element) => findElement(
      element,
      (child) => child.props?.className === 'btn btn-outline-danger'
    );

    it('does not render a delete button when onDelete is absent', function() {
      const html = renderToStaticMarkup(
        PhotoCarouselItem({
          photo: { id: 1, photo_url: 'http://example.com/oak.png' },
          name: 'Oak',
        })
      );

      expect(html).not.toContain('btn-outline-danger');
    });

    it('calls onDelete only after the user confirms', function() {
      const onDelete = jasmine.createSpy('onDelete');

      global.window = { confirm: jasmine.createSpy('confirm').and.returnValue(true) };

      const element = PhotoCarouselItem({
        photo: { id: 1, photo_url: 'http://example.com/oak.png' },
        name: 'Oak',
        onDelete,
      });

      findDeleteButton(element).props.onClick();

      expect(global.window.confirm).toHaveBeenCalledWith('Delete this photo?');
      expect(onDelete).toHaveBeenCalled();
    });

    it('does not call onDelete when the user dismisses the confirmation', function() {
      const onDelete = jasmine.createSpy('onDelete');

      global.window = { confirm: jasmine.createSpy('confirm').and.returnValue(false) };

      const element = PhotoCarouselItem({
        photo: { id: 1, photo_url: 'http://example.com/oak.png' },
        name: 'Oak',
        onDelete,
      });

      findDeleteButton(element).props.onClick();

      expect(onDelete).not.toHaveBeenCalled();
    });

    it('disables the delete button while deleting', function() {
      const html = renderToStaticMarkup(
        PhotoCarouselItem({
          photo: { id: 1, photo_url: 'http://example.com/oak.png' },
          name: 'Oak',
          onDelete: () => {},
          deleting: true,
        })
      );

      expect(html).toContain('disabled=""');
      expect(html).toContain('Deleting...');
    });

    it('renders the delete error when present', function() {
      const html = renderToStaticMarkup(
        PhotoCarouselItem({
          photo: { id: 1, photo_url: 'http://example.com/oak.png' },
          name: 'Oak',
          onDelete: () => {},
          error: 'Delete failed',
        })
      );

      expect(html).toContain('Error: Delete failed');
    });
  });
});
