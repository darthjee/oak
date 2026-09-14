# Plan: Docs — Photo upload spec

Issue: [245-docs-photo-upload-spec.md](../issues/245-docs-photo-upload-spec.md)

## Overview

Write and publish the settled architecture/contract doc for Oak's new HTTP photo upload flow. This is documentation-only (no `source/`/`frontend/` code changes) — it unblocks #246 (proxy), #247 (backend), and #248 (frontend) to build against a single fixed contract instead of guessing at each other's request/response shapes.

## Context

Issue #245 (via `enhance-issue`/`discuss-issue`) already settled every architectural decision this doc needs to record: Tent-proxy-owned Finalize, an `Oak::Photo.ready` column with no new model, session-cookie auth reuse, edge-case handling (duplicate/replay guard, no cleanup job, extension+size validation at the proxy), the two-step `ready` column migration, and `CreateItemPhotosJob`'s required explicit `ready: true`. What's still missing — and is this plan's actual synthesis work, not just transcription — is turning those decisions into concrete request/response contracts (routes, params, status codes, JSON shapes) precise enough for #246/#247/#248 to implement against without re-opening the design discussion.

## Steps

- [01 — Draft the spec](plan/01-draft-spec.md)
- [02 — Split into per-topic docs](plan/02-split-docs.md)
- [03 — Update the docs index](plan/03-update-summary.md)

## Notes

- No specialist agent split: this is pure `docs/agents/` work, which is `architect`'s own scope, not `backend`'s or `frontend`'s — see `determine_agents.md`'s "no candidate agent has work" case.
- No `## CI Checks` section: no CI job in `.circleci/config.yml` covers `docs/agents/*.md` (only `npm run lint` for `frontend/`).
- The issue names an initial location, `docs/agents/specs/photo_upload.md`, before the split into `docs/agents/photo_upload/*.md`. No other doc in this repo keeps both a flat pre-split file and its split folder side by side (`docs/agents/architecture.md` doesn't coexist with `docs/agents/architecture/`, etc.), so Step 2 removes the flat file once the split lands — `docs/agents/specs/` is a drafting waypoint, not a permanent location.
