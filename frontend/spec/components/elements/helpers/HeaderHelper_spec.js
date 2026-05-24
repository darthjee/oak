import { renderToStaticMarkup } from 'react-dom/server';
import HeaderHelper from '../../../../assets/js/components/elements/helpers/HeaderHelper.js';

describe('HeaderHelper', function() {
  it('renders loading state', function() {
    const html = renderToStaticMarkup(HeaderHelper.renderLoading());

    expect(html).toContain('Oak');
    expect(html).toContain('Loading navigation...');
    expect(html).toContain('Categories');
  });

  it('renders error state', function() {
    const html = renderToStaticMarkup(HeaderHelper.renderError('network failure'));

    expect(html).toContain('Navigation unavailable: network failure');
  });

  it('renders logged out menu', function() {
    const html = renderToStaticMarkup(HeaderHelper.render(false, [], jasmine.createSpy('onLogoff')));

    expect(html).toContain('Categories');
    expect(html).toContain('All');
    expect(html).toContain('Login');
    expect(html).not.toContain('Logoff');
    expect(html).not.toContain('>/#/categories/new<');
  });

  it('renders logged in menu with subscribed categories', function() {
    const html = renderToStaticMarkup(
      HeaderHelper.render(
        true,
        [{ slug: 'electronics', name: 'Electronics' }],
        jasmine.createSpy('onLogoff')
      )
    );

    expect(html).toContain('New');
    expect(html).toContain('Logoff');
    expect(html).toContain('/#/categories/electronics/items');
    expect(html).toContain('Electronics');
  });
});
