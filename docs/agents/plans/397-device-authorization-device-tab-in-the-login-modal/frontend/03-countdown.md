# Countdown formatter and hook
Create `utils/countdown.js`:

- `formatCountdown(expiresAt, now = Date.now())` → `'mm:ss'` of the remaining time, zero-padded,
  never below `'00:00'`; `null`/invalid `expiresAt` → `'00:00'`. Minutes may exceed 59 (e.g. `'60:00'`).
- `useCountdown(expiresAt)` → React hook: `useState` of the formatted value, `useEffect` with a 1s
  `setInterval` re-formatting while `expiresAt` is set, cleared on change/unmount. Thin wrapper; all
  logic in `formatCountdown`.

## Files to Change
- `frontend/assets/js/utils/countdown.js` — new formatter and hook.
- `frontend/spec/utils/countdown_spec.js` — new spec for `formatCountdown` (padding, clamp, invalid input) and a static render of `useCountdown`'s initial value.
