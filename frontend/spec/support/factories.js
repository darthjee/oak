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
