# docker-compose and env wiring

Mount the new `proxy/extension/` folder into the `oak_proxy` service (Tent auto-includes `extension/loader.php` after core classes load, per `docs/agents/external/tent/extending-tent.md`), and expose the max-upload-size limit to the PHP handler as an environment variable, mirroring backend's `Settings.photo_max_upload_size_bytes` (#247) rather than duplicating the value — the PHP process has no access to Rails' `Settings`.

Follow Oak's existing `OAK_`-prefixed env var convention (`source/app/models/env_settings.rb`'s `settings_prefix 'OAK'`) for the new variable's name, e.g. `OAK_PHOTO_MAX_UPLOAD_SIZE_BYTES`, so it reads naturally alongside `OAK_PASSWORD_SALT` etc. even though the proxy container consumes it directly rather than through `Settings`.

## Files to Change

- `docker-compose.yml` — add `./proxy/extension/:/var/www/html/extension/` to `oak_proxy`'s `volumes:`; ensure `OAK_PHOTO_MAX_UPLOAD_SIZE_BYTES` reaches `oak_proxy`'s environment (it already loads `env_file: .env`, so confirm the same `.env` value backend reads is sufficient, or add an explicit `environment:` passthrough if `oak_proxy` needs it under a different mechanism).
- `.env.dev.sample` — add `OAK_PHOTO_MAX_UPLOAD_SIZE_BYTES=<sensible dev default>` alongside the other `OAK_*` entries.
