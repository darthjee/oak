# Helper: tabs, device form and panels
Extend `LoginModalHelper.render(show, state, handlers)`.

New state keys: `mode`, `panel` (`'form'|'waiting'|'denied'|'expired'|'logged'|'notFound'`),
`submitError` (string|null), `networkError` (boolean), `countdown` (`'mm:ss'`).
New handlers: `onModeChange(mode)`, `onTryAgain`, `onDeviceSubmit`.

- `panel === 'form'`: Bootstrap nav tabs ("Log in with password" / "Authorize with logged device"),
  active by `state.mode`, each calling `onModeChange`. Password mode renders today's form unchanged.
  Device mode renders a form (`onSubmit={handlers.onDeviceSubmit}`) with `login`, "Keep me signed in",
  `submitError` alert, Cancel and a submit button.
- `panel === 'waiting'`: spinner, "waiting for another device to approve" text, `state.countdown`,
  a "network error, retrying" alert when `state.networkError`. No cancel button besides the modal close.
- Final panels (`denied`, `expired`, `logged`, `notFound`): one message each plus a "Try again"
  button calling `onTryAgain`.
- Split into small private static renderers (`#renderTabs`, `#renderPasswordForm`,
  `#renderDeviceForm`, `#renderWaiting`, `#renderFinal`) to keep lint happy.

## Files to Change
- `frontend/assets/js/components/elements/helpers/LoginModalHelper.jsx` — tabs, device form, panels.
- `frontend/spec/components/elements/helpers/LoginModalHelper_spec.js` — existing password expectations kept; new cases for tabs, device form, submit error, waiting (countdown, network alert), each final panel and "Try again".
