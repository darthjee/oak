# Plan: Device authorization: write specs and the specs hub

Issue: [392-device-authorization-write-specs-and-the-specs-hub.md](../../issues/392-device-authorization-write-specs-and-the-specs-hub.md)

## Overview

This is a documentation-only change, owned by the architect. It does three things:

- creates the permanent specs hub `docs/agents/specs.md`;
- writes the device-authorization specs, which are the entry file `docs/agents/specs/authorization.md` plus nine topic files under `docs/agents/specs/authorization/`;
- links the hub from `docs/agents/summary.md` and `docs/agents/folder-structure.md`.

No backend, frontend or proxy code changes.

## Context

Epic #391 ports Kerghan's device-authorization login to Oak. #393–#398 implement it, and several of them run in parallel, so they need one written contract they can all build against.

The specs must be **self-contained**. They must not link to or depend on Kerghan's porting guide (`~/messages/authorization.md`) or Kerghan's code (`~/orca/workspaces/kerghan/seahorse/frontend/`). Both live on this machine outside the repo. They are only **source material** for this work. Kerghan may be named once as the origin of the design, without a path.

Sources to read while writing:

- **#391** (`gh issue view 391`): the authoritative Oak decisions. Its sections are Edge cases, Backward compatibility, Adapting the reference to Oak, and Performance & security. When the guide and #391 disagree, #391 wins.
- **Guide sections:**
  - §1–3: overview, sequence and status machine;
  - §4: HTTP contract and settings;
  - §5–6: login modal, poller and mode switching;
  - §7: approver page;
  - §8: porting gotchas.
- **Oak code**, to describe the current state accurately:
  - `source/app/controllers/concerns/logged_user.rb`, `logged_user/processor.rb` and `user_required.rb`;
  - `source/app/controllers/login_controller.rb`;
  - `source/app/models/settings.rb`;
  - `frontend/assets/js/components/elements/LoginModal.jsx` and its controller and client;
  - `Header` and `HeaderController`;
  - `utils/authState.js`, `utils/HashRouteResolver.js` and `Router.js`.

Detail rule: **anything two sub-issues must agree on is specified exactly; anything owned by a single sub-issue is left to its plan.** The issue file lists both sides.

## Steps

- [01 — Specs hub and doc links](plan/01-specs-hub-and-links.md)
- [02 — Authorization entry file](plan/02-authorization-entry-file.md)
- [03 — Overview and status machine](plan/03-overview-and-status-machine.md)
- [04 — Data model and keep signed in](plan/04-data-model-and-keep-signed-in.md)
- [05 — HTTP contract](plan/05-http-contract.md)
- [06 — Frontend shell and login modal](plan/06-frontend-shell-and-login-modal.md)
- [07 — Approver page and security](plan/07-approver-page-and-security.md)
- [08 — Coverage and consistency check](plan/08-coverage-check.md)

## Notes

- Write everything in English. Keep every file under ~150 lines (`docs/agents/contributing/index.md`). If a topic file grows past that, split it further and update the entry file's index.
- Do not edit any GitHub issue. #393–#399 already point at `docs/agents/specs/authorization/`.
- There is no `backend.md`. Backend content lives in `data-model.md` and `http-contract.md`.
- Kerghan-only concepts must **not** appear in the specs:
  - the `register` / `recover` modes;
  - `ApiClient` refresh-and-retry;
  - the "user no longer approved → `denied`" transition, because Oak has no user deactivation.
- CI does not lint Markdown. Check the links manually in step 08.
