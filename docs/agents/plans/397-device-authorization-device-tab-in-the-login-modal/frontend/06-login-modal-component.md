# LoginModal component wiring
Update `LoginModal.jsx` (`{ show, onClose, onSuccess, mode }`).

- New state: `mode` (initial: normalized `mode` prop), `panel` (`'form'`), `submitError` (null),
  `networkError` (false), `expiresAt` (null). `countdown = useCountdown(expiresAt)`.
- `controller = useMemo(() => new LoginModalController(...), [])`; call
  `controller.setOnSuccess(onSuccess)` every render.
- `useEffect` on `[show, mode]`: when `show` becomes true or the `mode` prop changes while shown,
  `controller.switchMode(mode)`; when `show` becomes false, `controller.handleClear()` (stops poller).
- `useEffect(() => { const stop = () => controller.stop(); window.addEventListener('pagehide', stop); return () => { window.removeEventListener('pagehide', stop); stop(); }; }, [controller])`
  (guard `typeof window`).
- `handleClose` → `controller.handleClear()` + `onClose()`. Handlers: `onModeChange` →
  `controller.switchMode`, `onTryAgain` → `controller.switchMode(MODE_DEVICE)`, `onDeviceSubmit`
  → `preventDefault` + `controller.handleDeviceSubmit(login, keepSignedIn)`.
- Pass the new state keys/handlers to `LoginModalHelper.render`.

Update `LoginModal_spec.js`: the default state now includes `mode: 'password'`, `panel: 'form'`,
`submitError: null`, `networkError: false`, `countdown: '00:00'`; `mode: 'device'` prop starts in
device mode; device submit calls `handleDeviceSubmit`; "Try again" and mode-change handlers call
`switchMode`.

## Files to Change
- `frontend/assets/js/components/elements/LoginModal.jsx` — stable controller, new state, effects, handlers.
- `frontend/spec/components/elements/LoginModal_spec.js` — updated and extended.
