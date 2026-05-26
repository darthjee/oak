export const flushPromises = async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

export const stubLoginFetch = (status = 404) => {
  global.fetch = jasmine.createSpy('fetch').and.callFake((url) => {
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
