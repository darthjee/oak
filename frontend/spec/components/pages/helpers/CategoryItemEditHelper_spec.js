import CategoryItemEditHelper from '../../../../assets/js/components/pages/helpers/CategoryItemEditHelper.jsx';
import PhotosCarousel from '../../../../assets/js/components/elements/PhotosCarousel.jsx';
import { renderStatic } from '../../../support/factories.js';
import { itRendersLoadingAndErrorStates } from '../../../support/shared_examples/pageHelperExamples.js';

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

describe('CategoryItemEditHelper', function() {
  const item = {
    id: 35,
    name: 'Oak',
    description: 'A project item',
    kind_slug: 'code',
    category: { slug: 'project', name: 'Project' },
    links: [{ id: 1, text: 'GitHub', url: 'https://github.com/darthjee/oak' }],
  };
  const kinds = [{ slug: 'code', name: 'Code' }, { slug: 'docs', name: 'Docs' }];

  itRendersLoadingAndErrorStates(CategoryItemEditHelper, 'Loading category item edit...');

  it('renders edit form fields, links editor and actions', function() {
    const html = renderStatic(
      CategoryItemEditHelper.render(item, {
        kinds,
        saving: false,
        onFieldChange: () => {},
        onLinkChange: () => {},
        onRemoveLink: () => {},
        onAddLink: () => {},
        onSave: () => {},
      })
    );

    expect(html).toContain('/#/categories/project/items/35');
    expect(html).toContain('Save');
    expect(html).toContain('Name');
    expect(html).not.toContain('Category');
    expect(html).toContain('Kind');
    expect(html).toContain('Description');
    expect(html).toContain('Code');
    expect(html).toContain('Links');
    expect(html).toContain('Add link');
  });

  it('forwards deletingPhotoId/deleteErrorByPhotoId/onDeletePhoto to PhotosCarousel', function() {
    const onDeletePhoto = jasmine.createSpy('onDeletePhoto');
    const itemWithPhotos = { ...item, photos: [{ id: 1, photo_url: 'http://example.com/oak.png' }] };
    const element = CategoryItemEditHelper.render(
      itemWithPhotos,
      {
        kinds,
        saving: false,
        onFieldChange: () => {},
        onLinkChange: () => {},
        onRemoveLink: () => {},
        onAddLink: () => {},
        onSave: () => {},
      },
      {
        uploading: false,
        uploadError: null,
        selectedFile: null,
        onSelectFile: () => {},
        onUploadPhoto: () => {},
        deletingPhotoId: 5,
        deleteErrorByPhotoId: { 1: 'boom' },
        onDeletePhoto,
      }
    );

    const carousel = findElement(element, (child) => child.type === PhotosCarousel);

    expect(carousel.props.deletingPhotoId).toBe(5);
    expect(carousel.props.deleteErrorByPhotoId).toEqual({ 1: 'boom' });
    expect(carousel.props.onDeletePhoto).toBe(onDeletePhoto);
  });
});
