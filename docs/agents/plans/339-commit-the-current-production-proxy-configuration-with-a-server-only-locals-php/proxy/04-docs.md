# Document locals.php and update the photo specs
- Add a short "Production configuration" section to the proxy docs. Use the most fitting existing page, e.g. `docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md` or a proxy page under `docs/agents/`, and link it from `AGENTS.md` if it is a new page. It must say:
  - `proxy/prod_configuration/` is deployed on every tag, and `locals.php` is server-only, gitignored and carried forward by CI.
  - One-time bootstrap: create `$SSH_REMOTE_DIR/configuration/locals.php` by hand from the sample before the first tag.
  - When a rule needs a new variable: add it to `locals.php.sample` in the same PR, **and** to the live `locals.php` before tagging.
  - Hand edits to the live `locals.php` take effect immediately and are not versioned.
- `docs/agents/specs/photo/proxy-rules.md` and `deployment.md`: update "Current state". Prod config is now committed in `proxy/prod_configuration/` with `$backendHost` / `$staticRoot`, and `upload_proxy_files` already uploads it and carries `locals.php` forward. Reword the #330 parts so #330 only **adds** uploads/deletes rules, extra locals and the extension upload.

## Files to Change
- `docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md` (or the proxy doc page chosen) — production config / locals section
- `docs/agents/specs/photo/proxy-rules.md` — current state and #330 scope
- `docs/agents/specs/photo/deployment.md` — current state of `upload_proxy_files`
