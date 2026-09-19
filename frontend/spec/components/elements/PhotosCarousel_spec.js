import { renderToStaticMarkup } from 'react-dom/server';
import PhotosCarousel from '../../../assets/js/components/elements/PhotosCarousel.jsx';

describe('PhotosCarousel', function() {
  it('renders photos when photo list is present', function() {
    const html = renderToStaticMarkup(
      PhotosCarousel({
        photos: [{ photo_url: 'http://example.com/oak.png' }],
        name: 'Oak',
      })
    );

    expect(html).toContain('Photos');
    expect(html).toContain('http://example.com/oak.png');
    expect(html).toContain('carousel');
  });

  it('returns empty markup when photos are missing', function() {
    const html = renderToStaticMarkup(PhotosCarousel({ photos: [], name: 'Oak' }));

    expect(html).toBe('');
  });

  describe('per-photo delete props', function() {
    const photos = [
      { id: 1, photo_url: 'http://example.com/one.png' },
      { id: 2, photo_url: 'http://example.com/two.png' },
    ];

    it('does not forward an onDelete callback when onDeletePhoto is absent', function() {
      const element = PhotosCarousel({ photos, name: 'Oak' });
      const [, carousel] = element.props.children;
      const items = carousel.props.children;

      expect(items[0].props.onDelete).toBeUndefined();
      expect(items[1].props.onDelete).toBeUndefined();
    });

    it('forwards onDelete/deleting/error per photo id', function() {
      const onDeletePhoto = jasmine.createSpy('onDeletePhoto');
      const element = PhotosCarousel({
        photos,
        name: 'Oak',
        onDeletePhoto,
        deletingPhotoId: 2,
        deleteErrorByPhotoId: { 1: 'boom' },
      });

      const [, carousel] = element.props.children;
      const [firstItem, secondItem] = carousel.props.children;

      firstItem.props.onDelete();
      expect(onDeletePhoto).toHaveBeenCalledWith(1);

      secondItem.props.onDelete();
      expect(onDeletePhoto).toHaveBeenCalledWith(2);

      expect(firstItem.props.deleting).toBe(false);
      expect(secondItem.props.deleting).toBe(true);

      expect(firstItem.props.error).toBe('boom');
      expect(secondItem.props.error).toBe(null);
    });
  });
});
