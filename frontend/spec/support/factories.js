import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export const renderStatic = (jsx) => renderToStaticMarkup(jsx);

export const renderComponent = (Component, props = {}) =>
  renderToStaticMarkup(React.createElement(Component, props));

export const buildPaginatedMockClient = (overrides = {}) => ({
  fetchIndex: jasmine.createSpy('fetchIndex').and.returnValue(
    Promise.resolve({ data: [], pagination: { page: 1, pages: 1, perPage: 10 } })
  ),
  ...overrides,
});

export const flushPromises = async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

export const buildSpies = (...names) => {
  const spies = {};

  for (const name of names) {
    spies[name] = jasmine.createSpy(name);
  }

  return spies;
};

export const preserveGlobals = (...names) => {
  const originals = Object.fromEntries(
    names.map((name) => [name, global[name]])
  );

  return () => {
    names.forEach((name) => {
      global[name] = originals[name];
    });
  };
};

export const stubFetch = (implementation) => {
  global.fetch = jasmine.createSpy('fetch').and.callFake(implementation);

  return global.fetch;
};

export const stubFetchResponse = (response) => stubFetch(
  () => Promise.resolve(response)
);

export const stubLoginFetch = (status = 404) => {
  stubFetch((url) => {
    if (url === '/users/login.json') {
      if (status === 200) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'abc' }),
        });
      }

      return Promise.resolve({ ok: false, status });
    }

    throw new Error(`Unexpected URL: ${url}`);
  });
};
