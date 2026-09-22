# Proxy rules

Create `docs/agents/specs/photo/proxy-rules.md`, the target Tent configuration for #330 and #332:

- The versioned prod config location (e.g. `proxy/prod_configuration/`): `configure.php` loads `locals.php`, then the rules.
- `locals.php` variables: `$backendHost`, `$storageRoot`, `$staticRoot`, `$maxUploadSizeBytes`. The real file is server-only and git-ignored; `locals.php.sample` is committed.
- Rule order and why it matters: frontend → photos/snaps static → uploads → deletes → backend → redirects. The redirect catch-all would otherwise turn a missing `/photos/...` into an SPA redirect.
- Static `GET /photos` and `GET /snaps` rules (`begins_with`, `type => static`, `location => $staticRoot`) with `Tent\Middlewares\CacheControlMiddleware` (7 days). The 7-day cache is safe as long as a new upload never reuses a path (discuss: a re-upload with the same file name).
- The uploads/deletes rules reuse the existing dev regex matchers and handler classes, with `photosPath` renamed or re-pointed to `storageRoot`.
- A dev vs prod table (host `http://backend:3000` vs `$backendHost`; storage `/tmp/photos` mount of `dev_public_files` vs `$REMOTE_HOME/photos`; static root).

Put the PHP snippets in `examples.md` (step 06) and link to them.

## Files to Change
- `docs/agents/specs/photo/proxy-rules.md`: new.
