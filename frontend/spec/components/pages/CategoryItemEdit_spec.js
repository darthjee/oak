import CategoryItemEdit from '../../../assets/js/components/pages/CategoryItemEdit.jsx';
import CategoryItemEditHelper from '../../../assets/js/components/pages/helpers/CategoryItemEditHelper.jsx';
import { renderStatic } from '../../support/factories.js';
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

    const renderEdit = (overrides = {}) => CategoryItemEditHelper.render(
      overrides.item || item,
      kinds,
      false,
      noop,
      noop,
      noop,
      noop,
      noop,
      null,
      overrides.uploading || false,
      overrides.uploadError || null,
      overrides.selectedFile || null,
      overrides.onSelectFile || noop,
      overrides.onUploadPhoto || noop
    );

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
});
