# Plan: Device authorization: backend approver endpoints (mine, authorize, deny)

Issue: [395-device-authorization-backend-approver-endpoints-mine-authorize-deny.md](../../issues/395-device-authorization-backend-approver-endpoints-mine-authorize-deny.md)

## Overview
Add the approver side of device authorization to the Rails backend:
- the DB-backed wrong-password lockout (two `users` columns and two settings);
- atomic `open → approved` and `open → denied` transitions on `AuthorizationRequest`;
- three logged-in endpoints (`mine`, `authorize`, `deny`) that answer `401` when logged out and `400` for every business error.

See [backend.md](backend.md) for the full plan.
