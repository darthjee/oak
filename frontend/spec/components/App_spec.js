import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import App from '../../assets/js/components/App.jsx';

describe('App', function() {
  let originalWindow;
  let originalFetch;

  beforeEach(function() {
    originalWindow = global.window;
    originalFetch = global.fetch;

    global.window = {
      location: { hash: '' },
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
    };

    global.fetch = jasmine.createSpy('fetch').and.returnValue(
      Promise.resolve({ ok: false, status: 404 })
    );
  });

  afterEach(function() {
    global.window = originalWindow;
    global.fetch = originalFetch;
  });

  it('renders the navigation header', function() {
    const html = renderToStaticMarkup(React.createElement(App));

    expect(html).toContain('Oak');
  });

  it('renders the home placeholder when the hash is empty', function() {
    global.window.location.hash = '';

    const html = renderToStaticMarkup(React.createElement(App));

    expect(html).toContain('placeholder');
  });
});
