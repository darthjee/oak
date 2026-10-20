# Overview

Part of the [device authorization spec](../authorization.md).

## Roles

- **Requester** (device A, logged out): opens the login modal, switches to the
  **"Authorize with logged device"** mode, types only its `login`, may tick
  **"Keep me signed in"**, and submits. It then shows a waiting panel with a countdown and polls
  the request every 5 seconds.
- **Approver** (device B, logged in as the same user): opens **Account → Authorizations**
  (`#/authorizations`), presses **Refresh** to load the pending requests, and either
  **Authorizes** one (re-entering its own password) or **Denies** it.

`keepSignedIn` is chosen by the requester. The approver sees it as a badge and cannot change it.

## Sequence

```text
 Device A (requester, logged out)            Backend (Rails)            Device B (approver, logged in)
 ────────────────────────────────            ───────────────            ──────────────────────────────
 LoginModal, mode = device
 types login [+ keepSignedIn]
   │ POST /auth/authorization-requests.json
   │ { login, keepSignedIn } ──────────────▶ creates request (open)
   │ ◀────────── { uuid, pollToken, expiresAt }
   │
 panel = waiting (countdown, poller on)
   │ every 5s:
   │ POST /auth/authorization-requests/:uuid/poll.json
   │ { pollToken } ────────────────────────▶
   │ ◀───────────────────── { status: "open" }
   │                                                                Account → Authorizations, Refresh
   │                                         ◀───────────────────── POST /auth/authorization-requests/mine.json
   │                                         ──────────────────────▶ { requests: [ ... ] }
   │                                                                types own password, Authorize
   │                                         ◀───────────────────── POST /auth/authorization-requests/:uuid/authorize.json
   │                                           request → approved    { password }
   │                                         ──────────────────────▶ { authorized: true }  → list refreshed
   │
   │ POST .../:uuid/poll.json { pollToken } ▶ request → logged, Session created
   │ ◀── { status: "approved", session } + signed `session` cookie
   │
 poller stops → Header's onAuthSuccess
 (re-check GET /users/login.json, setLoggedIn(true), close modal, stay on current page)
```

If device B presses **Deny** instead (`POST .../:uuid/deny.json`), device A's next poll gets
`{ "status": "denied" }` and the modal shows the denied panel.

## Glossary

| Term | Meaning |
|---|---|
| Authorization request | One row in `authorization_requests`: a requester asking to log in as `login`. |
| `uuid` | Random UUIDv4 identifying the request in URLs. Not a secret on its own. |
| `pollToken` | Long random secret returned once by create. Required to poll. Kept in memory only by the requester; the server stores only its digest. |
| Requester | The logged-out device that created the request. |
| Approver | A logged-in device of the request's user, which authorizes or denies it. |
| Keep me signed in | Option that makes the minted session last `Settings.long_session_period` with a persistent cookie. See [keep-signed-in.md](keep-signed-in.md). |
| Session | A regular Oak `Session` row; the one minted by device authorization is identical to a password-login session. |
