import React from 'react';
import { formatCountdown, useCountdown } from '../../assets/js/utils/countdown.js';
import { renderStatic } from '../support/factories.js';

describe('countdown', function() {
  const NOW = Date.parse('2026-10-20T16:00:00.000Z');

  describe('formatCountdown', function() {
    it('formats the remaining time as mm:ss', function() {
      expect(formatCountdown('2026-10-20T16:04:05.000Z', NOW)).toEqual('04:05');
    });

    it('zero-pads minutes and seconds', function() {
      expect(formatCountdown('2026-10-20T16:00:07.000Z', NOW)).toEqual('00:07');
    });

    it('allows minutes above 59', function() {
      expect(formatCountdown('2026-10-20T17:00:00.000Z', NOW)).toEqual('60:00');
    });

    it('rounds partial seconds up', function() {
      expect(formatCountdown(NOW + 1500, NOW)).toEqual('00:02');
    });

    it('returns 00:00 at expiry', function() {
      expect(formatCountdown(NOW, NOW)).toEqual('00:00');
    });

    it('never goes below 00:00', function() {
      expect(formatCountdown('2026-10-20T15:00:00.000Z', NOW)).toEqual('00:00');
    });

    it('returns 00:00 for null', function() {
      expect(formatCountdown(null, NOW)).toEqual('00:00');
    });

    it('returns 00:00 for undefined', function() {
      expect(formatCountdown(undefined, NOW)).toEqual('00:00');
    });

    it('returns 00:00 for an invalid date', function() {
      expect(formatCountdown('not-a-date', NOW)).toEqual('00:00');
    });

    it('defaults now to the current time', function() {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(NOW));

      expect(formatCountdown('2026-10-20T16:01:00.000Z')).toEqual('01:00');

      jasmine.clock().uninstall();
    });
  });

  describe('useCountdown', function() {
    let restore;

    const Probe = ({ expiresAt }) => React.createElement('span', null, useCountdown(expiresAt));

    beforeEach(function() {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(NOW));
      restore = () => jasmine.clock().uninstall();
    });

    afterEach(function() {
      restore();
    });

    it('renders the initial formatted value', function() {
      const html = renderStatic(React.createElement(Probe, { expiresAt: '2026-10-20T16:02:30.000Z' }));

      expect(html).toEqual('<span>02:30</span>');
    });

    it('renders 00:00 without an expiresAt', function() {
      const html = renderStatic(React.createElement(Probe, { expiresAt: null }));

      expect(html).toEqual('<span>00:00</span>');
    });
  });
});
