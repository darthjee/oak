# Plan: Fix Cache Skip Flow

## Overview
Two coordinated fixes are needed: upgrade the Tent proxy to 0.7.7 (which checks both request and response headers for `X-Skip-Cache`) and add the missing header logic in the React frontend so that JSON requests properly bypass the proxy cache when appropriate.

## Context
The cache-skip mechanism relies on the `X-Skip-Cache` header configured in `docker_volumes/proxy_configuration/rules/backend.php`. Currently:

- Tent 0.7.6 only checks the *request* header, ignoring the response header. Version 0.7.7 fixes this to check both.
- The frontend never sends `X-Skip-Cache` on JSON requests, so the proxy caches responses that should not be cached (e.g., API calls made while the user is authenticated).

## Implementation Steps

### Step 1 — Upgrade Tent proxy to 0.7.7+
Update the Tent version reference (Docker image tag or gem version) from 0.7.6 to 0.7.7 so that the proxy respects the `X-Skip-Cache` response header in addition to the request header.

### Step 2 — Add `X-Skip-Cache` header on login/logoff requests
In the React frontend, configure the HTTP client (fetch / axios / React Query) so that requests to `/users/login.json` and `/users/logoff.json` **always** include `X-Skip-Cache: 1`.

### Step 3 — Track authentication state in the frontend
Introduce shared state (context, store, or a simple module) that is updated whenever the user logs in or out. This state is the source of truth used by the HTTP interceptor/wrapper to decide whether to include the header on other requests.

### Step 4 — Add `X-Skip-Cache` header on all other authenticated requests
Wire up the authenticated-state to the HTTP client so that every JSON request (other than login/logoff) includes `X-Skip-Cache: 1` when the user is logged in.

## Files to Change
- `docker_volumes/proxy_configuration/rules/backend.php` — verify/adjust `X-Skip-Cache` configuration if needed after version bump
- Tent version reference (Docker Compose or image tag) — bump from 0.7.6 → 0.7.7+
- `frontend/` — HTTP client setup: add interceptor/wrapper that injects `X-Skip-Cache` conditionally
- `frontend/` — auth state module: track login/logoff events and expose current auth state

## Notes
- The exact location of the Tent version reference (Docker image tag in `docker-compose.yml` or similar) needs to be verified in the codebase.
- The frontend HTTP client approach (fetch wrapper, axios interceptor, React Query default headers, etc.) depends on what is already in use — needs a quick code check.
- Auth state tracking must update synchronously on login/logoff so the very next request after login/logoff sends (or drops) the header correctly.
- This is a two-layer fix: proxy version + frontend headers. Both are required; fixing only one leaves the cache-skip broken in different ways.
