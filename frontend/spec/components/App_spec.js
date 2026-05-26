import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import App from '../../assets/js/components/App.jsx';
import { preserveGlobals, stubFetchResponse } from '../support/factories.js';

describe('App', function() {
  let restoreGlobals;

  const buildWindow = () => ({
    location: { hash: '' },
    addEventListener: jasmine.createSpy('addEventListener'),
    removeEventListener: jasmine.createSpy('removeEventListener'),
  });

  beforeEach(function() {
    restoreGlobals = preserveGlobals('window', 'fetch');
    global.window = buildWindow();
    stubFetchResponse({ ok: false, status: 404 });
  });

  afterEach(function() {
    restoreGlobals();
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
