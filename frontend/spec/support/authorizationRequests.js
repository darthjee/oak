export const flushMicrotasks = async (rounds = 10) => {
  for (let i = 0; i < rounds; i += 1) {
    await Promise.resolve();
  }
};

export const tickAndFlush = async (ms) => {
  jasmine.clock().tick(ms);
  await flushMicrotasks();
};

export const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

export const respondInSequence = (spy, ...responses) => {
  const queue = [...responses];

  spy.and.callFake(() => {
    const item = queue.shift();

    return item instanceof Error ? Promise.reject(item) : Promise.resolve(item);
  });
};
