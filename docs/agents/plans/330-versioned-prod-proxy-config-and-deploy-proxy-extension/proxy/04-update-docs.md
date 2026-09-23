# Update docs
Bring the docs in line with the new state.

- `docs/agents/architecture/infrastructure.md` (Production Proxy Configuration): add `uploads.php` / `deletes.php` to the tree, list the new locals, and say `upload_proxy_files` also uploads `proxy/extension/` after the Tent files.
- `docs/agents/specs/photo/proxy-rules.md` and `deployment.md`: move the upload/delete rules, the new locals and the extension upload from "proposal" to "Current state", keeping #331/#332/#335 as proposals.

## Files to Change
- `docs/agents/architecture/infrastructure.md` — prod config tree, locals, extension deploy
- `docs/agents/specs/photo/proxy-rules.md` — current state after #330
- `docs/agents/specs/photo/deployment.md` — current state after #330
