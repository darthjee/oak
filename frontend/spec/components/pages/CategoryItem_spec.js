import CategoryItem from '../../../assets/js/components/pages/CategoryItem.jsx';
import CategoryItemHelper from '../../../assets/js/components/pages/helpers/CategoryItemHelper.jsx';
import PhotosCarousel from '../../../assets/js/components/elements/PhotosCarousel.jsx';
import PhotoCarouselItem from '../../../assets/js/components/elements/PhotoCarouselItem.jsx';
import { preserveGlobals, renderStatic } from '../../support/factories.js';
import { itRendersPageLoadingState } from '../../support/shared_examples/pageExamples.js';
import { noop } from '../../support/noop.js';

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

describe('CategoryItem', function() {
  itRendersPageLoadingState(CategoryItem, 'Loading category item...');

  describe('photo delete section', function() {
    const itemWithPhoto = {
      id: 35,
      name: 'Oak',
      description: 'A project item',
      category: { slug: 'project', name: 'Project' },
      kind: { slug: 'code', name: 'Code' },
      links: [],
      photos: [{ id: 7, photo_url: 'http://example.com/oak.png' }],
    };
    let restoreGlobals;

    const buildProps = (overrides = {}) => ({
      deletingPhotoId: null,
      deleteErrorByPhotoId: null,
      onDeletePhoto: noop,
      ...overrides,
    });

    const renderItem = (overrides = {}) => {
      const props = buildProps(overrides);

      return CategoryItemHelper.render(
        itemWithPhoto,
        true,
        props.onDeletePhoto,
        props.deletingPhotoId,
        props.deleteErrorByPhotoId
      );
    };

    beforeEach(function() {
      restoreGlobals = preserveGlobals('window');
      global.window = { confirm: jasmine.createSpy('confirm').and.returnValue(true) };
    });

    afterEach(function() {
      restoreGlobals();
    });

    it('calls onDeletePhoto with the photo id once the delete is confirmed', function() {
      const onDeletePhoto = jasmine.createSpy('onDeletePhoto');
      const element = renderItem({ onDeletePhoto });
      const carouselElement = findElement(element, (child) => child.type === PhotosCarousel);
      const carouselOutput = PhotosCarousel(carouselElement.props);
      const itemElement = findElement(carouselOutput, (child) => child.type === PhotoCarouselItem);
      const itemOutput = PhotoCarouselItem(itemElement.props);
      const deleteButton = findElement(
        itemOutput,
        (child) => child.props?.className === 'btn btn-outline-danger'
      );

      deleteButton.props.onClick();

      expect(onDeletePhoto).toHaveBeenCalledWith(7);
    });

    it('disables and relabels the delete button for the photo being deleted', function() {
      const html = renderStatic(renderItem({ deletingPhotoId: 7 }));

      expect(html).toContain('Deleting...');
    });

    it('renders the delete error for the affected photo', function() {
      const html = renderStatic(renderItem({ deleteErrorByPhotoId: { 7: 'Unable to delete photo.' } }));

      expect(html).toContain('Error: Unable to delete photo.');
    });
  });
});
