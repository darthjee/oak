import PhotoMigrationController, {
  BATCH_LIMIT,
  buildEmptyTotals,
} from '../../../../assets/js/components/pages/controllers/PhotoMigrationController.js';
import { setLoggedIn } from '../../../../assets/js/utils/authState.js';
import { buildSpies, flushPromises } from '../../../support/factories.js';

describe('PhotoMigrationController', function() {
  let setters;
  let client;
  let queue;
  let cleanup;

  const batch = (migrated, missing, failed, remaining) => ({ migrated, missing, failed, remaining });

  const httpError = (status) => {
    const error = new Error('Request failed');
    error.status = status;
    return error;
  };

  const buildClient = () => ({
    migrate: jasmine.createSpy('migrate').and.callFake(() => {
      const next = queue.shift();

      if (next instanceof Error) {
        return Promise.reject(next);
      }

      return Promise.resolve(next);
    }),
  });

  const buildController = () => new PhotoMigrationController(
    setters.setLogged,
    setters.setStatus,
    setters.setTotals,
    setters.setError,
    client
  );

  const mount = (controller) => {
    cleanup = controller.buildEffect()();
    return controller;
  };

  beforeEach(function() {
    setters = buildSpies('setLogged', 'setStatus', 'setTotals', 'setError');
    queue = [];
    client = buildClient();
    cleanup = null;
  });

  afterEach(function() {
    if (cleanup) {
      cleanup();
    }
    setLoggedIn(false);
  });

  it('uses a batch limit of 20', function() {
    expect(BATCH_LIMIT).toBe(20);
  });

  it('builds a default client when none is given', function() {
    const controller = new PhotoMigrationController(
      setters.setLogged, setters.setStatus, setters.setTotals, setters.setError
    );

    expect(typeof controller.client.migrate).toBe('function');
  });

  describe('#buildEffect', function() {
    it('sets the logged state from authState', function() {
      setLoggedIn(true);
      mount(buildController());

      expect(setters.setLogged).toHaveBeenCalledWith(true);
    });

    it('updates the logged state when authState changes', function() {
      mount(buildController());
      setters.setLogged.calls.reset();

      setLoggedIn(true);

      expect(setters.setLogged).toHaveBeenCalledWith(true);
    });

    it('unsubscribes on cleanup', function() {
      mount(buildController());
      cleanup();
      cleanup = null;
      setters.setLogged.calls.reset();

      setLoggedIn(true);

      expect(setters.setLogged).not.toHaveBeenCalled();
    });
  });

  describe('#start', function() {
    it('requests batches with the batch limit', async function() {
      queue = [batch(1, [], [], 0)];
      const controller = mount(buildController());

      await controller.start();

      expect(client.migrate).toHaveBeenCalledOnceWith(BATCH_LIMIT);
    });

    it('sets running status when starting', async function() {
      queue = [batch(1, [], [], 0)];
      const controller = mount(buildController());

      await controller.start();

      expect(setters.setStatus.calls.allArgs()).toEqual([['running'], ['done']]);
    });

    it('accumulates totals across batches', async function() {
      queue = [
        batch(3, [18], [{ id: 19, reason: 'rename failed' }], 9),
        batch(2, [20, 21], [], 4),
        batch(4, [], [{ id: 22, reason: 'io' }], 0),
      ];
      const controller = mount(buildController());

      await controller.start();

      const expected = {
        migrated: 9,
        missing: [18, 20, 21],
        failed: [{ id: 19, reason: 'rename failed' }, { id: 22, reason: 'io' }],
        remaining: 0,
      };

      expect(client.migrate).toHaveBeenCalledTimes(3);
      expect(controller.totals).toEqual(expected);
      expect(setters.setTotals).toHaveBeenCalledWith(expected);
      expect(controller.status).toBe('done');
    });

    it('stops with done when remaining is 0', async function() {
      queue = [batch(2, [], [], 0)];
      const controller = mount(buildController());

      await controller.start();

      expect(controller.status).toBe('done');
      expect(setters.setStatus).toHaveBeenCalledWith('done');
    });

    it('stops with noProgress when a batch made no progress', async function() {
      queue = [
        batch(2, [], [], 3),
        batch(0, [], [{ id: 5, reason: 'rename failed' }], 3),
        batch(1, [], [], 0),
      ];
      const controller = mount(buildController());

      await controller.start();

      expect(client.migrate).toHaveBeenCalledTimes(2);
      expect(controller.status).toBe('noProgress');
      expect(controller.totals.failed).toEqual([{ id: 5, reason: 'rename failed' }]);
      expect(controller.totals.remaining).toBe(3);
    });

    it('counts missing photos as progress', async function() {
      queue = [batch(0, [1, 2], [], 1), batch(0, [3], [], 0)];
      const controller = mount(buildController());

      await controller.start();

      expect(client.migrate).toHaveBeenCalledTimes(2);
      expect(controller.status).toBe('done');
    });

    [401, 403].forEach((status) => {
      it(`stops with a login error on ${status}`, async function() {
        queue = [batch(2, [], [], 5), httpError(status)];
        const controller = mount(buildController());

        await controller.start();

        expect(client.migrate).toHaveBeenCalledTimes(2);
        expect(controller.status).toBe('error');
        expect(setters.setError).toHaveBeenCalledWith('You need to be logged in to migrate photos.');
        expect(controller.totals.migrated).toBe(2);
      });
    });

    it('stops with a status error on 502', async function() {
      queue = [httpError(502)];
      const controller = mount(buildController());

      await controller.start();

      expect(controller.status).toBe('error');
      expect(setters.setError).toHaveBeenCalledWith('Migration request failed (status 502).');
    });

    it('stops with a generic error when there is no status', async function() {
      queue = [new Error('network')];
      const controller = mount(buildController());

      await controller.start();

      expect(controller.status).toBe('error');
      expect(setters.setError).toHaveBeenCalledWith('Migration request failed.');
    });

    it('is a no-op after a terminal status', async function() {
      queue = [batch(1, [], [], 0), batch(1, [], [], 0)];
      const controller = mount(buildController());

      await controller.start();
      setters.setStatus.calls.reset();
      await controller.start();

      expect(client.migrate).toHaveBeenCalledTimes(1);
      expect(setters.setStatus).not.toHaveBeenCalled();
      expect(controller.status).toBe('done');
    });

    it('is a no-op while already running', async function() {
      let resolveFirst;
      client.migrate.and.callFake(() => new Promise((resolve) => {
        resolveFirst = resolve;
      }));
      const controller = mount(buildController());

      const run = controller.start();
      await controller.start();

      expect(client.migrate).toHaveBeenCalledTimes(1);

      resolveFirst(batch(1, [], [], 0));
      await run;
    });
  });

  describe('#stop', function() {
    it('waits for the request in flight, merges its result and stops', async function() {
      let resolveFirst;
      client.migrate.and.callFake(() => new Promise((resolve) => {
        resolveFirst = resolve;
      }));
      const controller = mount(buildController());

      const run = controller.start();
      controller.stop();

      expect(controller.status).toBe('stopping');
      expect(setters.setStatus).toHaveBeenCalledWith('stopping');

      resolveFirst(batch(3, [7], [], 10));
      await run;

      expect(client.migrate).toHaveBeenCalledTimes(1);
      expect(controller.status).toBe('stopped');
      expect(controller.totals).toEqual({ migrated: 3, missing: [7], failed: [], remaining: 10 });
    });

    it('prefers done when the in-flight batch finished everything', async function() {
      let resolveFirst;
      client.migrate.and.callFake(() => new Promise((resolve) => {
        resolveFirst = resolve;
      }));
      const controller = mount(buildController());

      const run = controller.start();
      controller.stop();
      resolveFirst(batch(3, [], [], 0));
      await run;

      expect(controller.status).toBe('done');
    });

    it('is a no-op when not running', async function() {
      const controller = mount(buildController());

      controller.stop();

      expect(controller.status).toBe('idle');
      expect(setters.setStatus).not.toHaveBeenCalled();

      queue = [batch(1, [], [], 0)];
      await controller.start();
      setters.setStatus.calls.reset();
      controller.stop();

      expect(controller.status).toBe('done');
      expect(setters.setStatus).not.toHaveBeenCalled();
    });

    it('keeps start disabled after a stopped run', async function() {
      let resolveFirst;
      client.migrate.and.callFake(() => new Promise((resolve) => {
        resolveFirst = resolve;
      }));
      const controller = mount(buildController());

      const run = controller.start();
      controller.stop();
      resolveFirst(batch(3, [], [], 10));
      await run;

      await controller.start();

      expect(client.migrate).toHaveBeenCalledTimes(1);
      expect(controller.status).toBe('stopped');
    });
  });

  describe('unmount', function() {
    it('does not fire further requests after unmount', async function() {
      let resolveFirst;
      client.migrate.and.callFake(() => new Promise((resolve) => {
        resolveFirst = resolve;
      }));
      const controller = mount(buildController());

      const run = controller.start();
      cleanup();
      cleanup = null;
      setters.setTotals.calls.reset();

      resolveFirst(batch(3, [], [], 10));
      await run;
      await flushPromises();

      expect(client.migrate).toHaveBeenCalledTimes(1);
      expect(setters.setTotals).not.toHaveBeenCalled();
    });
  });

  describe('buildEmptyTotals', function() {
    it('returns empty totals', function() {
      expect(buildEmptyTotals()).toEqual({ migrated: 0, missing: [], failed: [], remaining: null });
    });
  });
});
