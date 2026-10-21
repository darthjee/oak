import AuthorizationRequestPoller from '../../assets/js/utils/AuthorizationRequestPoller.js';
import {
  flushMicrotasks, jsonResponse, respondInSequence, tickAndFlush as tick,
} from '../support/authorizationRequests.js';

describe('AuthorizationRequestPoller', function() {
  const START = new Date('2026-10-20T16:00:00.000Z');
  const EXPIRES_AT = '2026-10-20T16:01:00.000Z';
  const REQUEST = { uuid: 'uuid-1', pollToken: 'secret-token', expiresAt: EXPIRES_AT };

  let client;
  let onApproved;
  let onFinal;
  let onNetworkError;
  let poller;

  const respondWith = (...responses) => respondInSequence(client.poll, ...responses);

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
});
