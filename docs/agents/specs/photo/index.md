# Photo Upload in Production: Guide

Temporary guide for making photo upload work in production (parent #328).
Sub-issues #330–#336 follow it, and #337 deletes it after moving the parts
worth keeping into [`photo_upload/`](../../photo_upload/index.md).

This guide covers only the production work. For the Init/Submit/Finalize
flow, the request/response contracts and auth, see
[Photo Upload](../../photo_upload/index.md) and its
[Contracts](../../photo_upload/contracts.md) and
[Proxy & Auth](../../photo_upload/proxy-and-auth.md) pages.

## Why

Photo upload works in dev but not in production:

- The prod proxy config exists only on the server. It has no submit, delete
  or photo serving rules.
- `proxy/extension/` is never deployed, so the custom handlers don't exist in
  prod.
- Each deploy replaces the whole site directory, and nothing links a
  persistent photo folder into it.
- Nothing makes the resized `photos/` and `snaps/` versions. Today
  `prod_public_files/convert.sh` does this by hand, and rsyncs the result to
  `photos.oak.ffavs.net`.

The backend runs on Render and can't see the proxy disk (Dreamhost). So all
photo file I/O and resizing happen in the Tent proxy.

## Storage layout

One persistent storage root holds three subfolders:

| Environment | Storage root | Subfolders |
| --- | --- | --- |
| dev | `dev_public_files` (mounted as `/tmp/photos`) | `origin/`, `photos/`, `snaps/` |
| prod | `$REMOTE_HOME/photos` | `origin/`, `photos/`, `snaps/` |

## Path decision

The backend `file_path` stays as it is today:

```text
users/<uid>/items/<id>/<file>
```

The proxy gets a single `storageRoot` and adds the prefixes itself:

| File | Path under `storageRoot` | Size |
| --- | --- | --- |
| Original upload | `origin/<file_path>` | unchanged |
| Photo | `photos/<file_path>` | fit within 800x1064, shrink only |
| Snap | `snaps/<file_path>` | fit within 215x215, shrink only |

`Oak::Photo::FileUrl` already builds
`<photos_server_url>/{photos,snaps}/users/<uid>/items/<id>/<file>`, so the
only URL change is the `OAK_PHOTOS_SERVER_URL` value (#336).

## Serving

`GET /photos/...` and `GET /snaps/...` are served by static proxy rules
(see [Proxy Rules](proxy-rules.md)). In prod the static root is the release
directory, where `photos` and `snaps` are symlinks into
`$REMOTE_HOME/photos` (see [Deployment](deployment.md)).

**Invariant.** For every photo, these two paths are the same file:

```text
<storageRoot>/{photos,snaps}/<file_path>     (written by the upload handler)
<staticRoot>/{photos,snaps}/<file_path>      (read by the static rule)
```

The request URI `/{photos,snaps}/<file_path>` resolves to the second path.
Every sub-issue must keep this true.

## Sub-issue map

| Issue | Owner | What | Depends on |
| --- | --- | --- | --- |
| #329 | architect | This guide | none |
| #339 | proxy | Commit the current prod proxy config to `proxy/prod_configuration/` with a server-only `locals.php`; `upload_proxy_files` deploys it | none |
| #330 | proxy / architect | Add submit and delete rules and new locals to `proxy/prod_configuration/`; `upload_proxy_files` also deploys `proxy/extension/` | #339 |
| #331 | architect | CircleCI `link_photos` job; `release` requires it | ships with #330 |
| #332 | proxy | Static `/photos` and `/snaps` rules with `Cache-Control` | #330, #331 |
| #333 | backend / proxy | Align settings, jobs, dev proxy config and mounts with the layout | none |
| #334 | proxy / architect | Move to `darthjee/tent:1.0.0` (GD) | darthjee/tent#287 |
| #335 | proxy | Resize into `photos/` and `snaps/`; delete removes all three files | #333, #334 |
| #336 | backend / architect | Switch `OAK_PHOTOS_SERVER_URL`, retire `photos.oak.ffavs.net` | #251 (file migration) |
| #337 | architect | Move lasting content into `photo_upload/`, delete this guide | all of the above |

**#333 no longer changes `file_path`.** The proxy adds the `origin/`,
`photos/` and `snaps/` prefixes, so the backend contract stays the same. So
issue #333 only aligns settings (`Settings.photos_path` and the jobs that use it),
the dev proxy config and mounts (`dev_public_files` as the storage root) and
checks. Its issue body offers two options and points to `architecture.md`;
this page is the answer: keep `users/...`, the proxy adds the prefixes.

#330 passed `photosPath => $storageRoot . '/origin'` as an interim; #335
replaced it with `storageRoot => $storageRoot`, and the handlers now add the
prefixes themselves (see [Proxy Rules](proxy-rules.md#upload-and-delete-rules)).

## Pages

- [Proxy Rules](proxy-rules.md): versioned prod config, `locals.php`, rule
  order, static rules.
- [Deployment](deployment.md): CircleCI changes, `link_photos`, on-disk
  layout.
- [Resizing](resizing.md): GD resizing on submit, and delete.
- [Rollout](rollout.md): ship order, #251 migration, URL switch, prod checks.
- [Examples](examples.md): PHP and CircleCI snippets (proposals).

## Background

Majora (`darthjee/majora`) already runs this setup in production: a
versioned `proxy/prod_configuration/` with a server-only `locals.php`, a
static `photos` rule with a custom `CacheControlMiddleware`, an `uploads`
rule, and a `link_photos` CircleCI job. Its notes are not in this repo; the
pages above summarise what applies to Oak.
