import { renderToStaticMarkup } from 'react-dom/server';
import PhotoCarouselItem from '../../../assets/js/components/elements/PhotoCarouselItem.jsx';

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
});
