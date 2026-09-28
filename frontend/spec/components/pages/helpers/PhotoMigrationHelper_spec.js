import PhotoMigrationHelper from '../../../../assets/js/components/pages/helpers/PhotoMigrationHelper.jsx';
import { renderStatic } from '../../../support/factories.js';
import { noop } from '../../../support/noop.js';

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

describe('PhotoMigrationHelper', function() {
  const emptyTotals = { migrated: 0, missing: [], failed: [], remaining: null };
  const totals = {
    migrated: 3,
    missing: [18, 21],
    failed: [{ id: 19, reason: 'rename failed' }],
    remaining: 9,
  };
  const handlers = { onStart: noop, onStop: noop };

  const render = (status, currentTotals = emptyTotals, error = null, currentHandlers = handlers) =>
    PhotoMigrationHelper.render(status, currentTotals, error, currentHandlers);

  const findButton = (element) => findElement(element, (child) => child.type === 'button');

  describe('.renderLoggedOut', function() {
    it('asks the user to log in without a button', function() {
      const html = renderStatic(PhotoMigrationHelper.renderLoggedOut());

      expect(html).toContain('Please log in to migrate your photos.');
      expect(html).toContain('alert-info');
      expect(html).not.toContain('<button');
    });
  });

  describe('.render', function() {
    it('renders the title and explanation', function() {
      const html = renderStatic(render('idle'));

      expect(html).toContain('container mt-4');
      expect(html).toContain('Photo migration');
      expect(html).toContain('legacy photos');
    });

    it('renders an enabled Start button when idle that calls onStart', function() {
      const onStart = jasmine.createSpy('onStart');
      const onStop = jasmine.createSpy('onStop');
      const button = findButton(render('idle', emptyTotals, null, { onStart, onStop }));

      expect(button.props.children).toBe('Start');
      expect(button.props.disabled).toBe(false);

      button.props.onClick();

      expect(onStart).toHaveBeenCalled();
      expect(onStop).not.toHaveBeenCalled();
    });

    it('renders an enabled Stop button when running that calls onStop', function() {
      const onStart = jasmine.createSpy('onStart');
      const onStop = jasmine.createSpy('onStop');
      const button = findButton(render('running', emptyTotals, null, { onStart, onStop }));

      expect(button.props.children).toBe('Stop');
      expect(button.props.disabled).toBe(false);

      button.props.onClick();

      expect(onStop).toHaveBeenCalled();
      expect(onStart).not.toHaveBeenCalled();
    });

    it('renders a disabled Stopping button when stopping', function() {
      const button = findButton(render('stopping'));

      expect(button.props.children).toBe('Stopping…');
      expect(button.props.disabled).toBe(true);
    });

    [
      ['done', 'Done'],
      ['stopped', 'Stopped'],
      ['noProgress', 'Finished'],
      ['error', 'Failed'],
    ].forEach(([status, label]) => {
      it(`renders a disabled ${label} button when ${status}`, function() {
        const button = findButton(render(status, totals, 'boom'));

        expect(button.props.children).toBe(label);
        expect(button.props.disabled).toBe(true);
      });
    });

    it('does not show remaining before it is known', function() {
      const html = renderStatic(render('idle'));

      expect(html).toContain('Migrated: 0');
      expect(html).not.toContain('Remaining');
    });

    it('renders progress counts', function() {
      const html = renderStatic(render('running', totals));

      expect(html).toContain('Migrated: 3');
      expect(html).toContain('Remaining: 9');
      expect(html).toContain('Missing: 2');
      expect(html).toContain('Failed: 1');
    });

    it('renders the missing and failed lists when not empty', function() {
      const html = renderStatic(render('running', totals));

      expect(html).toContain('Missing photos');
      expect(html).toContain('#18');
      expect(html).toContain('#21');
      expect(html).toContain('Failed photos');
      expect(html).toContain('#19 — rename failed');
    });

    it('does not render the lists when empty', function() {
      const html = renderStatic(render('running', { ...emptyTotals, remaining: 4 }));

      expect(html).not.toContain('Missing photos');
      expect(html).not.toContain('Failed photos');
    });

    it('renders no status message while idle or running', function() {
      expect(renderStatic(render('idle'))).not.toContain('alert');
      expect(renderStatic(render('running', totals))).not.toContain('alert');
    });

    it('renders the done message', function() {
      const html = renderStatic(render('done', { ...totals, remaining: 0 }));

      expect(html).toContain('All photos migrated.');
    });

    it('renders the stopped message', function() {
      const html = renderStatic(render('stopped', totals));

      expect(html).toContain('Stopped.');
    });

    it('renders the no progress message with remaining photos', function() {
      const html = renderStatic(render('noProgress', totals));

      expect(html).toContain(
        '9 photos could not be migrated now (see failures); try again in a few minutes.'
      );
    });

    it('renders a neutral no progress message when nothing remains', function() {
      const html = renderStatic(render('noProgress', { ...totals, remaining: 0 }));

      expect(html).toContain('No more photos could be migrated.');
    });

    it('renders the error in an alert', function() {
      const html = renderStatic(render('error', totals, 'Migration request failed (status 502).'));

      expect(html).toContain('alert-danger');
      expect(html).toContain('Migration request failed (status 502).');
    });

    it('renders a generic error when none is given', function() {
      const html = renderStatic(render('error', totals, null));

      expect(html).toContain('Migration request failed.');
    });
  });

  describe('.buttonLabel', function() {
    it('falls back to Start for an unknown status', function() {
      expect(PhotoMigrationHelper.buttonLabel('unknown')).toBe('Start');
    });
  });
});
