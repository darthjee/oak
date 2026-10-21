import { useEffect, useState } from 'react';

/**
 * Pads a number to two digits.
 *
 * @param {number} value number to pad
 * @returns {string} zero-padded value
 */
const pad = (value) => String(value).padStart(2, '0');

/**
 * Converts an expiration value into epoch milliseconds.
 *
 * @param {string|number|Date|null|undefined} expiresAt expiration timestamp
 * @returns {number} epoch milliseconds, or NaN when invalid
 */
const toTime = (expiresAt) => {
  if (expiresAt === null || expiresAt === undefined || expiresAt === '') return NaN;

  return new Date(expiresAt).getTime();
};

/**
 * Formats the remaining time until `expiresAt` as `mm:ss`, never below `00:00`.
 *
 * @param {string|number|Date|null|undefined} expiresAt expiration timestamp
 * @param {number} [now=Date.now()] current time in epoch milliseconds
 * @returns {string} remaining time formatted as `mm:ss`
 */
export const formatCountdown = (expiresAt, now = Date.now()) => {
  const target = toTime(expiresAt);

  if (Number.isNaN(target)) return '00:00';

  const seconds = Math.max(0, Math.ceil((target - now) / 1000));

  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
};

/**
 * React hook returning the `mm:ss` countdown to `expiresAt`, refreshed every second.
 *
 * @param {string|number|Date|null|undefined} expiresAt expiration timestamp
 * @returns {string} remaining time formatted as `mm:ss`
 */
export const useCountdown = (expiresAt) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return undefined;

    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(id);
  }, [expiresAt]);

  return formatCountdown(expiresAt, now);
};
