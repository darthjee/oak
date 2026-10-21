import AuthorizationRequestPoller from '../../assets/js/utils/AuthorizationRequestPoller.js';

describe('AuthorizationRequestPoller', function() {
  const START = new Date('2026-10-20T16:00:00.000Z');
  const EXPIRES_AT = '2026-10-20T16:01:00.000Z';
  const REQUEST = { uuid: 'uuid-1', pollToken: 'secret-token', expiresAt: EXPIRES_AT };

  let client;
  let onApproved;
  let onFinal;
  let onNetworkError;
  let poller;

  const flushMicrotasks = async () => {
    for (let i = 0; i < 10; i += 1) {
      await Promise.resolve();
    }
  };

  const tick = async (ms) => {
    jasmine.clock().tick(ms);
    await flushMicrotasks();
  };

  const jsonResponse = (body, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });

  const respondWith = (...responses) => {
    const queue = [...responses];

    client.poll.and.callFake(() => {
      const item = queue.shift();

      return item instanceof Error ? Promise.reject(item) : Promise.resolve(item);
    });
  };

  beforeEach(function() {
    jasmine.clock().install();
    jasmine.clock().mockDate(START);

    client = { poll: jasmine.createSpy('poll') };
    onApproved = jasmine.createSpy('onApproved');
    onFinal = jasmine.createSpy('onFinal');
    onNetworkError = jasmine.createSpy('onNetworkError');

    poller = new AuthorizationRequestPoller({ client, onApproved, onFinal, onNetworkError });
  });

  afterEach(function() {
    poller.stop();
    jasmine.clock().uninstall();
  });

  describe('#start', function() {
    it('does not poll immediately', function() {
      respondWith(jsonResponse({ status: 'open' }));
      poller.start(REQUEST);

      expect(client.poll).not.toHaveBeenCalled();
      expect(poller.isRunning()).toBeTrue();
    });

    it('polls after the interval with uuid and poll token', async function() {
      respondWith(jsonResponse({ status: 'open' }));
      poller.start(REQUEST);

      await tick(5000);

      expect(client.poll).toHaveBeenCalledOnceWith('uuid-1', 'secret-token');
    });

    it('keeps polling every interval while open', async function() {
      client.poll.and.callFake(() => Promise.resolve(jsonResponse({ status: 'open' })));
      poller.start(REQUEST);

      await tick(5000);
      await tick(5000);
      await tick(5000);

      expect(client.poll).toHaveBeenCalledTimes(3);
      expect(onNetworkError).not.toHaveBeenCalled();
    });

    it('uses a custom interval', async function() {
      client.poll.and.callFake(() => Promise.resolve(jsonResponse({ status: 'open' })));
      poller = new AuthorizationRequestPoller({ client, onFinal, interval: 1000 });
      poller.start(REQUEST);

      await tick(1000);

      expect(client.poll).toHaveBeenCalledTimes(1);
    });
  });

  describe('no overlap', function() {
    it('waits for the current poll to settle before scheduling the next', async function() {
      let resolvePoll;
      client.poll.and.callFake(() => new Promise((resolve) => {
        resolvePoll = resolve;
      }));
      poller.start(REQUEST);

      await tick(5000);
      await tick(5000);
      await tick(5000);

      expect(client.poll).toHaveBeenCalledTimes(1);

      resolvePoll(jsonResponse({ status: 'open' }));
      await flushMicrotasks();
      await tick(5000);

      expect(client.poll).toHaveBeenCalledTimes(2);
    });
  });

  describe('results', function() {
    it('stops and calls onApproved when approved', async function() {
      respondWith(jsonResponse({ status: 'approved', session: { token: 'x' } }));
      poller.start(REQUEST);

      await tick(5000);

      expect(onApproved).toHaveBeenCalledTimes(1);
      expect(onFinal).not.toHaveBeenCalled();
      expect(poller.isRunning()).toBeFalse();

      await tick(5000);

      expect(client.poll).toHaveBeenCalledTimes(1);
    });

    ['denied', 'expired', 'logged'].forEach((status) => {
      it(`stops and calls onFinal('${status}') when ${status}`, async function() {
        respondWith(jsonResponse({ status }));
        poller.start(REQUEST);

        await tick(5000);

        expect(onFinal).toHaveBeenCalledOnceWith(status);
        expect(poller.isRunning()).toBeFalse();

        await tick(5000);

        expect(client.poll).toHaveBeenCalledTimes(1);
      });
    });

    it('stops and calls onFinal(notFound) on 404', async function() {
      respondWith(jsonResponse({ message: 'Not found' }, 404));
      poller.start(REQUEST);

      await tick(5000);

      expect(onFinal).toHaveBeenCalledOnceWith('notFound');
      expect(poller.isRunning()).toBeFalse();
    });
  });

  describe('failures', function() {
    it('reports a network error and keeps polling', async function() {
      respondWith(new Error('network'), jsonResponse({ status: 'open' }));
      poller.start(REQUEST);

      await tick(5000);

      expect(onNetworkError).toHaveBeenCalledOnceWith(true);
      expect(poller.isRunning()).toBeTrue();

      await tick(5000);

      expect(client.poll).toHaveBeenCalledTimes(2);
    });

    it('clears the network error after the next successful poll', async function() {
      respondWith(new Error('network'), jsonResponse({ status: 'open' }), jsonResponse({ status: 'open' }));
      poller.start(REQUEST);

      await tick(5000);
      await tick(5000);
      await tick(5000);

      expect(onNetworkError.calls.allArgs()).toEqual([[true], [false]]);
    });

    it('treats non-OK statuses other than 404 as a retryable failure', async function() {
      respondWith(jsonResponse({ message: 'boom' }, 500), jsonResponse({ status: 'open' }));
      poller.start(REQUEST);

      await tick(5000);

      expect(onNetworkError).toHaveBeenCalledWith(true);
      expect(onFinal).not.toHaveBeenCalled();

      await tick(5000);

      expect(client.poll).toHaveBeenCalledTimes(2);
    });

    it('treats bad JSON as a retryable failure', async function() {
      respondWith({ ok: true, status: 200, json: () => Promise.reject(new Error('bad json')) });
      poller.start(REQUEST);

      await tick(5000);

      expect(onNetworkError).toHaveBeenCalledWith(true);
      expect(poller.isRunning()).toBeTrue();
    });

    it('treats unknown statuses as a retryable failure', async function() {
      respondWith(jsonResponse({ status: 'weird' }));
      poller.start(REQUEST);

      await tick(5000);

      expect(onNetworkError).toHaveBeenCalledWith(true);
      expect(onFinal).not.toHaveBeenCalled();
      expect(poller.isRunning()).toBeTrue();
    });
  });

  describe('expiry', function() {
    it('fires expired at expiresAt without a request', async function() {
      client.poll.and.callFake(() => new Promise(() => {}));
      poller = new AuthorizationRequestPoller({
        client, onFinal, interval: 120000,
      });
      poller.start(REQUEST);

      await tick(60000);

      expect(onFinal).toHaveBeenCalledOnceWith('expired');
      expect(client.poll).not.toHaveBeenCalled();
      expect(poller.isRunning()).toBeFalse();
    });

    it('fires expired immediately when expiresAt is already in the past', async function() {
      poller.start({ ...REQUEST, expiresAt: '2026-10-20T15:00:00.000Z' });

      await tick(0);

      expect(onFinal).toHaveBeenCalledOnceWith('expired');
      expect(client.poll).not.toHaveBeenCalled();
    });

    it('checks the local clock before each poll', async function() {
      let current = START.getTime();
      poller = new AuthorizationRequestPoller({
        client, onFinal, now: () => current,
      });
      poller.start(REQUEST);
      current = Date.parse(EXPIRES_AT);

      await tick(5000);

      expect(onFinal).toHaveBeenCalledOnceWith('expired');
      expect(client.poll).not.toHaveBeenCalled();
    });

    it('does not fire expired after a final result', async function() {
      respondWith(jsonResponse({ status: 'denied' }));
      poller.start(REQUEST);

      await tick(5000);
      await tick(60000);

      expect(onFinal.calls.allArgs()).toEqual([['denied']]);
    });
  });

  describe('#stop', function() {
    it('ignores responses still in flight', async function() {
      let resolvePoll;
      client.poll.and.callFake(() => new Promise((resolve) => {
        resolvePoll = resolve;
      }));
      poller.start(REQUEST);

      await tick(5000);
      poller.stop();
      resolvePoll(jsonResponse({ status: 'approved' }));
      await flushMicrotasks();

      expect(onApproved).not.toHaveBeenCalled();
      expect(poller.isRunning()).toBeFalse();
    });

    it('ignores in-flight failures', async function() {
      let rejectPoll;
      client.poll.and.callFake(() => new Promise((_resolve, reject) => {
        rejectPoll = reject;
      }));
      poller.start(REQUEST);

      await tick(5000);
      poller.stop();
      rejectPoll(new Error('network'));
      await flushMicrotasks();

      expect(onNetworkError).not.toHaveBeenCalled();
    });

    it('cancels pending polls and the expiry timer', async function() {
      poller.start(REQUEST);
      poller.stop();

      await tick(60000);

      expect(client.poll).not.toHaveBeenCalled();
      expect(onFinal).not.toHaveBeenCalled();
    });

    it('is idempotent', function() {
      poller.stop();
      poller.stop();

      expect(poller.isRunning()).toBeFalse();
    });
  });

  describe('restart', function() {
    it('ignores responses from the previous run', async function() {
      let resolveFirst;
      client.poll.and.returnValues(
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
        Promise.resolve(jsonResponse({ status: 'open' }))
      );
      poller.start(REQUEST);

      await tick(5000);
      poller.start({ ...REQUEST, uuid: 'uuid-2', pollToken: 'other-token' });
      resolveFirst(jsonResponse({ status: 'denied' }));
      await flushMicrotasks();

      expect(onFinal).not.toHaveBeenCalled();
      expect(poller.isRunning()).toBeTrue();

      await tick(5000);

      expect(client.poll.calls.mostRecent().args).toEqual(['uuid-2', 'other-token']);
    });
  });
});
