# Issue: Fix Cache Skip Flow

## Description
The cache-skip mechanism — which ensures that login/logoff and authenticated requests bypass the proxy cache — is currently broken in two distinct ways: a bug in the proxy version and missing `X-Skip-Cache` header logic on the frontend.

## Problem
- **Proxy bug:** Tent 0.7.6 only checks the *request* header for `X-Skip-Cache`; the response header is ignored. Version 0.7.7 fixes this to check both request and response headers.
- **Missing header on JSON requests:** The `X-Skip-Cache` header is not sent on JSON requests where cache-skipping is actually needed:
  - `/users/login.json` and `/users/logoff.json` should **always** send the header.
  - All other requests should send the header **when the user is logged in**.
  - Login/logoff events should update shared state so all subsequent requests know whether to include the header.

## Expected Behavior
- Tent is upgraded to 0.7.7 or later so that the `X-Skip-Cache` response header is also respected.
- JSON requests to login and logoff endpoints always include `X-Skip-Cache`.
- All other JSON requests include `X-Skip-Cache` whenever the user is authenticated.
- A login/logoff event mechanism updates the authentication state used to decide header inclusion.

## Solution
- Upgrade Tent proxy to version 0.7.7+ in the proxy configuration.
- On the frontend (Angular SPA), introduce a service/state that tracks login status and is updated on login/logoff events.
- Inject `X-Skip-Cache` header via an HTTP interceptor: always for auth endpoints, conditionally (when logged in) for others.

## Benefits
- Logged-in users always receive fresh (non-cached) data from the API.
- Login/logoff state changes are immediately reflected without stale cached responses.
- Aligns frontend header logic with the backend proxy cache-skip configuration.

---
See issue for details: https://github.com/darthjee/oak/issues/201
