# Approver page and security

## `approver-page.md` (#398)

- **Route** `#/authorizations`, added through `utils/HashRouteResolver.js` / `Router.js`. The page lives under `components/pages/` with a controller and a helper, like existing pages.
- **Content:**
  - a list of the user's open requests, each showing IP, User-Agent, age / expiry and a "keep signed in" badge;
  - a short "only approve requests you started" warning;
  - a **Refresh** button (no automatic polling).
- **Per row:**
  - a password field and an **Authorize** button;
  - a **Deny** button;
  - a `400` shows its `message` on that row;
  - after a success, refresh the list.
- **On a `401`:**
  1. call `authState.setLoggedIn(false)`;
  2. open the login modal through the event bus (`frontend-shell.md`);
  3. treat the result as "nothing to do".

## `security.md`

- **Threats and mitigations:**
  - **Login enumeration.** The create response is identical for every login, and the requester never receives account information before approval.
  - **Token leakage.** The `pollToken` is long and random, returned once, kept in memory only, and stored as a SHA256 digest compared in constant time. The `uuid` is a random UUIDv4.
  - **Brute force.** The create rate limit is per IP, and the authorize lockout is per user. Both are stored in the DB.
  - **Caching.** `X-Skip-Cache` is always sent.
  - **CSRF.** Oak exempts the new JSON POSTs. `SameSite=Lax` and the required password limit a forged request to, at worst, a deny.
  - **Phishing.** Mitigations: the password is required to authorize, the request metadata is shown, and the warning text is displayed.
  - **Audit logging.** Log create, approve, deny and session-minted events, with IP and user id.
- **Performance.** A poll is one indexed lookup by `uuid`, and the approver's list uses `(user_id, status)`. Expiry is computed on read, so no job is needed.
- **Out of scope:**
  - user deactivation;
  - matching confirmation codes;
  - cleanup of old requests;
  - password-login rate limiting;
  - unifying logged-out responses as `401` (a separate follow-up issue).

## Files to Change
- `docs/agents/specs/authorization/approver-page.md` — new.
- `docs/agents/specs/authorization/security.md` — new.
