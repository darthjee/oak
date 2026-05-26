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
});
