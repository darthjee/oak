import AuthorizationsHelper from '../../../../assets/js/components/pages/helpers/AuthorizationsHelper.jsx';
import { buildSpies, renderStatic } from '../../../support/factories.js';
import { findButton, findElement } from '../../../support/elementFinder.js';
import { randomCredential } from '../../../support/testCredentials.js';

const NOW = new Date('2026-10-21T10:30:00Z');

const buildRequest = (overrides = {}) => ({
  uuid: 'abc-123',
  requestIp: '10.0.0.1',
  requestUserAgent: 'curl/8.0',
  createdAt: '2026-10-21T10:25:00Z',
  expiresAt: '2026-10-21T10:40:00Z',
  keepSignedIn: false,
  ...overrides,
});

describe('AuthorizationsHelper', function() {
  let handlers;

  const render = (options = {}) => AuthorizationsHelper.render({
    requests: [buildRequest()],
    error: null,
    rows: {},
    now: NOW,
    handlers,
    ...options,
  });

  beforeEach(function() {
    handlers = buildSpies(
      'onRefresh', 'onDeny', 'onOpenAuthorize', 'onCancelAuthorize', 'onPasswordChange', 'onConfirm'
    );
  });

  describe('.formatAge', function() {
    it('returns "just now" under a minute', function() {
      expect(AuthorizationsHelper.formatAge('2026-10-21T10:29:01Z', NOW)).toBe('just now');
    });

    it('returns minutes at exactly one minute', function() {
      expect(AuthorizationsHelper.formatAge('2026-10-21T10:29:00Z', NOW)).toBe('1 min ago');
    });

    it('returns minutes under an hour', function() {
      expect(AuthorizationsHelper.formatAge('2026-10-21T09:30:01Z', NOW)).toBe('59 min ago');
    });

    it('returns hours from one hour on', function() {
      expect(AuthorizationsHelper.formatAge('2026-10-21T08:00:00Z', NOW)).toBe('2 h ago');
    });

    it('accepts a numeric now', function() {
      expect(AuthorizationsHelper.formatAge('2026-10-21T10:25:00Z', NOW.getTime()))
        .toBe('5 min ago');
    });

    it('returns empty text for invalid dates', function() {
      expect(AuthorizationsHelper.formatAge('not a date', NOW)).toBe('');
    });
  });

  describe('.formatExpiry', function() {
    it('returns "Expired" when past', function() {
      expect(AuthorizationsHelper.formatExpiry('2026-10-21T10:29:00Z', NOW)).toBe('Expired');
    });

    it('returns "Expired" at the exact expiry time', function() {
      expect(AuthorizationsHelper.formatExpiry('2026-10-21T10:30:00Z', NOW)).toBe('Expired');
    });

    it('rounds partial minutes up', function() {
      expect(AuthorizationsHelper.formatExpiry('2026-10-21T10:30:01Z', NOW))
        .toBe('Expires in 1 min');
    });

    it('returns the minutes left', function() {
      expect(AuthorizationsHelper.formatExpiry('2026-10-21T10:40:00Z', NOW))
        .toBe('Expires in 10 min');
    });

    it('returns empty text for invalid dates', function() {
      expect(AuthorizationsHelper.formatExpiry(undefined, NOW)).toBe('');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      expect(renderStatic(AuthorizationsHelper.renderLoading()))
        .toContain('Loading authorization requests...');
    });
  });

  describe('.render', function() {
    it('renders the heading, warning and refresh button', function() {
      const html = renderStatic(render());

      expect(html).toContain('Authorizations');
      expect(html).toContain('Only approve requests you started yourself');
      expect(html).toContain('Refresh');
    });

    it('wires the refresh button', function() {
      findButton(render(), 'Refresh').props.onClick();

      expect(handlers.onRefresh).toHaveBeenCalled();
    });

    it('renders the empty message without requests', function() {
      const html = renderStatic(render({ requests: [] }));

      expect(html).toContain('No pending requests.');
    });

    it('renders the page error and keeps the refresh button', function() {
      const element = render({ error: 'Boom' });
      const html = renderStatic(element);

      expect(html).toContain('Error: Boom');
      expect(html).not.toContain('10.0.0.1');
      expect(findButton(element, 'Refresh')).not.toBeNull();
    });

    it('renders the row fields', function() {
      const html = renderStatic(render());

      expect(html).toContain('10.0.0.1');
      expect(html).toContain('curl/8.0');
      expect(html).toContain('5 min ago');
      expect(html).toContain('Expires in 10 min');
      expect(html).toContain('Deny');
      expect(html).toContain('Authorize');
    });

    it('renders the keep signed in badge only when keepSignedIn is true', function() {
      expect(renderStatic(render({ requests: [buildRequest({ keepSignedIn: true })] })))
        .toContain('Keep signed in');
      expect(renderStatic(render())).not.toContain('Keep signed in');
      expect(renderStatic(render({ requests: [buildRequest({ keepSignedIn: 'yes' })] })))
        .not.toContain('Keep signed in');
    });

    it('wires the deny and authorize buttons', function() {
      const element = render();

      findButton(element, 'Deny').props.onClick();
      findButton(element, 'Authorize').props.onClick();

      expect(handlers.onDeny).toHaveBeenCalledWith('abc-123');
      expect(handlers.onOpenAuthorize).toHaveBeenCalledWith('abc-123');
    });

    it('does not render the password form when closed', function() {
      const html = renderStatic(render());

      expect(html).not.toContain('type="password"');
      expect(html).not.toContain('Confirm');
    });

    describe('when the row form is open', function() {
      let typedPassword;
      let rows;

      beforeEach(function() {
        typedPassword = randomCredential();
        rows = {
          'abc-123': { formOpen: true, password: typedPassword, error: null, submitting: false },
        };
      });

      it('renders the password input and confirm button', function() {
        const element = render({ rows });
        const html = renderStatic(element);

        expect(html).toContain('type="password"');
        expect(html).toContain(`value="${typedPassword}"`);
        expect(html).toContain('Confirm');
        expect(findButton(element, 'Authorize')).toBeNull();
      });

      it('wires the password change', function() {
        const input = findElement(render({ rows }), (node) => node.type === 'input');

        input.props.onChange({ target: { value: 'new' } });

        expect(handlers.onPasswordChange).toHaveBeenCalledWith('abc-123', 'new');
      });

      it('confirms on submit', function() {
        const form = findElement(render({ rows }), (node) => node.type === 'form');
        const event = jasmine.createSpyObj('event', ['preventDefault']);

        form.props.onSubmit(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(handlers.onConfirm).toHaveBeenCalledWith('abc-123');
      });

      it('wires the cancel button', function() {
        findButton(render({ rows }), 'Cancel').props.onClick();

        expect(handlers.onCancelAuthorize).toHaveBeenCalledWith('abc-123');
      });
    });

    it('disables the row buttons while submitting', function() {
      const element = render({
        rows: { 'abc-123': { formOpen: false, password: '', error: null, submitting: true } },
      });

      expect(findButton(element, 'Deny').props.disabled).toBe(true);
      expect(findButton(element, 'Authorize').props.disabled).toBe(true);
    });

    it('renders the row error', function() {
      const html = renderStatic(render({
        rows: { 'abc-123': { formOpen: true, password: '', error: 'Wrong password', submitting: false } },
      }));

      expect(html).toContain('Wrong password');
    });
  });
});
