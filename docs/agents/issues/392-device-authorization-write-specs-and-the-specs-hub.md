# Issue: Device authorization: write specs and the specs hub

## Description

Part of Epic #391, device authorization login ("Authorize with logged device"). A user logs in on a new device by typing only their login. A device where they are already logged in then approves the request by re-entering their password. The design comes from Kerghan's implementation.

This is the Epic's first sub-issue and is **documentation only**. It writes:

- the permanent specs hub `docs/agents/specs.md`;
- the authorization specs, which every other sub-issue (#393–#399) implements against.

**Agent:** architect.

## Problem

The Epic is split into backend and frontend sub-issues, and several of them run in parallel: #393 with #396, then #395 with #397. Without one written contract, each would guess the endpoint shapes, status values, settings and event names on its own, and they would drift apart.

The reference material sits outside the repo: Kerghan's porting guide in `~/messages/` and Kerghan's code. Agents implementing the sub-issues cannot rely on it.

Oak also has no place for temporary, Epic-scoped specs, and no rule for how such specs are laid out or when they are removed.

## Expected Behavior

- `docs/agents/specs.md` exists as a permanent hub for features being developed or planned, and is never deleted.
- `docs/agents/specs/authorization.md` and its topic files under `docs/agents/specs/authorization/` describe the whole feature, adapted to Oak.
  - An agent working on any of #393–#398 can implement its part using only these files and the Oak codebase.
  - Every shared contract is stated exactly.
- `docs/agents/summary.md` lists the hub, and `docs/agents/folder-structure.md` lists `specs/`.
- No code changes.

## Solution

### 1. Specs hub: `docs/agents/specs.md`

The specs use a three-level hierarchy:

- **`docs/agents/specs.md`** is the permanent hub and is never deleted.
  - It lists the features currently being developed or planned, one row each: feature, Epic, and a link to `docs/agents/specs/<feature>.md`.
  - When no feature is active it says "No active specs."
- **`docs/agents/specs/<feature>.md`** is the feature's own hub. It indexes `docs/agents/specs/<feature>/*.md` and maps each sub-issue to the topic files it uses.
- **`docs/agents/specs/<feature>/*.md`** are the topic files.

The hub states these rules:

- **Every spec must be split** as above, never one large file. Each file follows the ~150-line target from `docs/agents/contributing/index.md`.
- **Lifecycle:**
  - An Epic's first issue writes `specs/<feature>.md` and `specs/<feature>/*.md`, and adds the feature's row to the hub.
  - Implementing issues update the spec if the implementation has to deviate from it.
  - The Epic's last issue deletes `specs/<feature>.md`, `specs/<feature>/` and the hub row. It **may** copy parts into the permanent docs (routes, settings, architecture, frontend patterns) when that makes sense. This is a judgment call, not a requirement.

The hub is linked from:

- `docs/agents/summary.md`: one row for `specs.md`, like the other docs. Feature specs are listed only in the hub. `AGENTS.md` gets no dedicated section.
- `docs/agents/folder-structure.md`: add `specs/` to the `docs/agents/` layout.

### 2. Authorization specs

The entry file `docs/agents/specs/authorization.md` contains:

- a one-paragraph summary;
- the two roles (requester and approver);
- an index of the topic files;
- a map from each sub-issue to the files it uses.

Topic files under `docs/agents/specs/authorization/`:

| File | Covers | Used by |
|---|---|---|
| `overview.md` | Requester and approver roles, the end-to-end flow (sequence), glossary (request, poll token, approver) | all |
| `status-machine.md` | `open → approved → logged`, `denied`, `expired`; allowed transitions; the server's expiry is what counts; only the first poll after approval gets a session | #394, #395, #397 |
| `data-model.md` | Table and columns, poll token stored as a digest, lockout counters stored in the DB, settings (request expiry, `long_session_period`) | #393, #394, #395 |
| `http-contract.md` | All five endpoints (create and poll for the requester; mine, authorize and deny for the approver) with request and response shapes and status codes; `401` when logged out (new endpoints only); always `X-Skip-Cache`; an unknown login answers the same as a known one and its request just expires | #394, #395, #397, #398 |
| `keep-signed-in.md` | Checkbox on the password form, long vs. normal session (`Settings.long_session_period`), cookie expiry, existing logins unchanged | #393 |
| `frontend-shell.md` | Login-modal event bus (event names, payloads, who sends and who listens), "Account" dropdown (Authorizations + Logoff) | #396 |
| `login-modal.md` | `password` / `device` modes only; poller lifecycle (stops when the modal closes); 404 is final; a network error shows a "retrying" alert and polling continues; success goes through the Header's `onAuthSuccess` and stays on the current page; modal unavailable when logged in | #397 |
| `approver-page.md` | Authorizations page (`#/authorizations`): pending list, Refresh button, authorize with password, deny | #398 |
| `security.md` | Threat notes (login enumeration, token leakage, brute force, caching) and the explicit out-of-scope list: user deactivation, matching confirmation codes, cleanup of old requests, password-login rate limiting | all |

The specs adapt the reference to Oak. Each adaptation goes in its topic file; there is no separate "differences from the reference" file. The adaptations are:

- the field is `login`, not `username`;
- the modal has only the `password` and `device` modes;
- success goes through the Header's `onAuthSuccess` and stays on the current page;
- a new login-modal event bus;
- an "Account" dropdown that contains Authorizations;
- only the new endpoints answer `401` when logged out, and existing endpoints are unchanged;
- the new endpoints always send `X-Skip-Cache`;
- "Keep me signed in" uses `Settings.long_session_period`;
- the approver-password lockout is stored in the DB;
- the `pollToken` is stored as a digest;
- the approver page has a Refresh button.

There is no `backend.md`. The backend content is split between `data-model.md` and `http-contract.md`.

### 3. Level of detail

The rule is: **anything two sub-issues must agree on is specified exactly. Anything owned by a single sub-issue is left to its plan.**

- **Specified exactly:**
  - endpoint paths and methods, JSON request and response bodies (field names and types), and the status code for every outcome;
  - status values and allowed transitions;
  - table columns and types, as far as the API exposes them;
  - settings names and defaults (`long_session_period`, request expiry, lockout thresholds);
  - event-bus event names and payloads, and the `onAuthSuccess` contract;
  - frontend routes and the Account dropdown entries;
  - user-visible behaviour: which alerts appear (network error + retry, denied, expired), and when the poller starts and stops.
- **Left to the plans:**
  - Ruby class, module, controller and concern names, and file locations;
  - index choices and migration details beyond the columns;
  - the React component, controller and helper split, and file names;
  - exact UI copy and styling (the specs give the meaning of each message, not its wording);
  - test layout.

### 4. Self-contained

The specs do not link to or depend on Kerghan's porting guide (`~/messages/authorization.md`) or Kerghan's code. Kerghan may be named once as the origin of the design, without a path.

Whoever writes this issue reads the guide, Kerghan's frontend (`~/orca/workspaces/kerghan/seahorse/frontend/`) and the decisions recorded in #391 as source material. Everything relevant is copied into the specs and adapted to Oak.

### 5. Cross-linking

This issue does **not** edit other GitHub issues. The sub-issue → topic-file map in the entry file is the single source of truth.

#393–#399 already point at `docs/agents/specs/authorization/`. Each sub-issue's own enhance or discuss run can name its exact topic files. The "may copy lasting parts into the permanent docs" note for #399 is handled when #399 is enhanced.

### Out of scope

Any code change.

## Benefits

- Backend and frontend sub-issues can run in parallel against one fixed contract.
- Implementing agents need nothing outside the repo.
- Future Epics get a standard, split, temporary spec layout with a clear lifecycle.
