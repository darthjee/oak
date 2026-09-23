# Update photo docs
Mark #332 as done in the photo production guide:
- `proxy-rules.md`: move the static rules into "Current state" (prod and dev), drop the "Tent has no built-in CacheControlMiddleware … must port it" proposal wording in favor of the real class `Oak\Proxy\CacheControlMiddleware` (2xx-only), resolve the file-name uniqueness note (UUID in `CreateBuilder#unique_file_name`), and set the dev static root to `/tmp/photos`.
- `examples.md`: update the "Static photo rules" example to use `Oak\\Proxy\\CacheControlMiddleware`.

## Files to Change
- `docs/agents/specs/photo/proxy-rules.md` — reflect the implemented state.
- `docs/agents/specs/photo/examples.md` — correct middleware class in the example.
