import CategoryItemEdit from '../../../assets/js/components/pages/CategoryItemEdit.jsx';
import CategoryItemEditHelper from '../../../assets/js/components/pages/helpers/CategoryItemEditHelper.jsx';
import PhotosCarousel from '../../../assets/js/components/elements/PhotosCarousel.jsx';
import PhotoCarouselItem from '../../../assets/js/components/elements/PhotoCarouselItem.jsx';
import { preserveGlobals, renderStatic } from '../../support/factories.js';
import { itRendersPageLoadingState } from '../../support/shared_examples/pageExamples.js';

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

describe('CategoryItemEdit', function() {
  itRendersPageLoadingState(CategoryItemEdit, 'Loading category item edit...');

  describe('photo upload section', function() {
    const item = {
      id: 35,
      name: 'Oak',
      description: 'A project item',
      kind_slug: 'code',
      category: { slug: 'project', name: 'Project' },
      links: [],
      photos: [],
    };
    const kinds = [{ slug: 'code', name: 'Code' }];
    const noop = () => {};

    const buildProps = (overrides = {}) => ({
      item,
      uploading: false,
      uploadError: null,
      selectedFile: null,
      onSelectFile: noop,
      onUploadPhoto: noop,
      deletingPhotoId: null,
      deleteErrorByPhotoId: null,
      onDeletePhoto: noop,
      ...overrides,
    });

    const renderEdit = (overrides = {}) => {
      const props = buildProps(overrides);

      return CategoryItemEditHelper.render(
        props.item,
        kinds,
        false,
        noop,
        noop,
        noop,
        noop,
        noop,
        null,
        props.uploading,
        props.uploadError,
        props.selectedFile,
        props.onSelectFile,
        props.onUploadPhoto,
        props.deletingPhotoId,
        props.deleteErrorByPhotoId,
        props.onDeletePhoto
      );
    };

    it('renders the upload section when item.id is present', function() {
      const html = renderStatic(renderEdit());

      expect(html).toContain('Upload');
      expect(html).toContain('type="file"');
    });

    it('shows Uploading... and disables the upload button while uploading', function() {
      const html = renderStatic(renderEdit({ uploading: true }));

      expect(html).toContain('Uploading...');
      expect(html).toContain('disabled');
    });

    it('renders an upload error message when set', function() {
      const html = renderStatic(renderEdit({ uploadError: 'Unable to upload photo.' }));

      expect(html).toContain('Error: Unable to upload photo.');
    });

    it('does not render an upload error message when unset', function() {
      const html = renderStatic(renderEdit());

      expect(html).not.toContain('Error:');
    });

    it('calls onUploadPhoto with the selected file when the upload button is clicked', function() {
      const onUploadPhoto = jasmine.createSpy('onUploadPhoto');
      const file = new Blob(['data'], { type: 'image/png' });
      const element = renderEdit({ selectedFile: file, onUploadPhoto });
      const uploadButton = findElement(
        element,
        (child) => child.type === 'button' && (child.props.children === 'Upload' || child.props.children === 'Uploading...')
      );

      uploadButton.props.onClick();

      expect(onUploadPhoto).toHaveBeenCalledWith(file);
    });

    it('calls onSelectFile with the chosen file when the file input changes', function() {
      const onSelectFile = jasmine.createSpy('onSelectFile');
      const file = new Blob(['data'], { type: 'image/png' });
      const element = renderEdit({ onSelectFile });
      const fileInput = findElement(element, (child) => child.type === 'input' && child.props.type === 'file');

      fileInput.props.onChange({ target: { files: [file] } });

      expect(onSelectFile).toHaveBeenCalledWith(file);
    });
  });

  describe('photo delete section', function() {
    const itemWithPhoto = {
      id: 35,
      name: 'Oak',
      description: 'A project item',
      kind_slug: 'code',
      category: { slug: 'project', name: 'Project' },
      links: [],
      photos: [{ id: 7, photo_url: 'http://example.com/oak.png' }],
    };
    const kinds = [{ slug: 'code', name: 'Code' }];
    const noop = () => {};
    let restoreGlobals;

    const buildProps = (overrides = {}) => ({
      item: itemWithPhoto,
      deletingPhotoId: null,
      deleteErrorByPhotoId: null,
      onDeletePhoto: noop,
      ...overrides,
    });

    const renderEdit = (overrides = {}) => {
      const props = buildProps(overrides);

      return CategoryItemEditHelper.render(
        props.item,
        kinds,
        false,
        noop,
        noop,
        noop,
        noop,
        noop,
        null,
        false,
        null,
        null,
        noop,
        noop,
        props.deletingPhotoId,
        props.deleteErrorByPhotoId,
        props.onDeletePhoto
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
      const element = renderEdit({ onDeletePhoto });
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
      const html = renderStatic(renderEdit({ deletingPhotoId: 7 }));

      expect(html).toContain('Deleting...');
    });

    it('renders the delete error for the affected photo', function() {
      const html = renderStatic(renderEdit({ deleteErrorByPhotoId: { 7: 'Unable to delete photo.' } }));

      expect(html).toContain('Error: Unable to delete photo.');
    });
  });
});
