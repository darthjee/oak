# AuthorizationRequestPoller
Create `utils/AuthorizationRequestPoller.js`, a plain class with no React dependency.

```js
new AuthorizationRequestPoller({
  client,            // AuthorizationRequestsClient (poll)
  onApproved,        // () => void
  onFinal,           // (panel: 'denied'|'expired'|'logged'|'notFound') => void
  onNetworkError,    // (failing: boolean) => void
  interval = 5000,
  now = () => Date.now(),
});
poller.start({ uuid, pollToken, expiresAt }); // stops any previous run first
poller.stop();                                 // idempotent
poller.isRunning();
```

Behavior:
- `start` schedules the first poll after `interval` via `setTimeout`, and a one-shot expiry timer at
  `Date.parse(expiresAt) - now()` (clamped at 0) that stops and calls `onFinal('expired')`.
- Each poll first checks `now() >= expiresAt` → stop + `onFinal('expired')` without a request.
- The next poll is scheduled only after the current one settles (no overlap).
- Results: `200 {status:'open'}` → `onNetworkError(false)` if it was failing, schedule next;
  `approved` → stop, `onApproved()`; `denied`/`expired`/`logged` → stop, `onFinal(status)`;
  HTTP `404` → stop, `onFinal('notFound')`; network error, non-OK status other than 404, bad JSON
  or unknown status → `onNetworkError(true)`, schedule next.
- Every async continuation checks a run token/stopped flag so a stopped (or restarted) poller ignores
  in-flight responses.
- Keep `pollToken` only in the instance; never log it.

Test with `jasmine.clock()` (install/uninstall, `mockDate`) and a spy client returning promises;
flush microtasks between ticks.

## Files to Change
- `frontend/assets/js/utils/AuthorizationRequestPoller.js` — new poller.
- `frontend/spec/utils/AuthorizationRequestPoller_spec.js` — new spec: interval, no overlap, each status, 404, network error retry and alert clearing, expiry timer, local clock check, stop ignores in-flight responses, restart.
