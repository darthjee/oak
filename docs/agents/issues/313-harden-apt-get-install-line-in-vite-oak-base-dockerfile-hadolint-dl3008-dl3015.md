# Issue: Harden apt-get install line in vite_oak-base Dockerfile (Hadolint DL3008 + DL3015)

## Description
Codacy's Hadolint check flags the `apt-get install` line in `dockerfiles/vite_oak-base/Dockerfile:5` for not pinning the package version and not restricting recommended packages.

## Problem
On `dockerfiles/vite_oak-base/Dockerfile:5`:

```dockerfile
RUN apt-get update && apt-get install -y rsync && rm -rf /var/lib/apt/lists/*
```

Two Hadolint findings (category BestPractice, severity Warning) are raised on this line:

- **DL3008** — "Pin versions in apt get install. Instead of `apt-get install <package>` use `apt-get install <package>=<version>`" (https://app.codacy.com/p/681941/issues/index?resultDataId=131495649303)
- **DL3015** — "Avoid additional packages by specifying `--no-install-recommends`" (https://app.codacy.com/p/681941/issues/index?resultDataId=131495649305)

## Solution
Update the `apt-get install` line to pin `rsync`'s version and add `--no-install-recommends`:

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends rsync=3.2.7-1+deb12u6 && rm -rf /var/lib/apt/lists/*
```

Context confirmed against the current `darthjee/node:0.2.1` base image (Debian 12 "bookworm"):

- `apt-cache policy rsync` resolves candidate `3.2.7-1+deb12u6` (from `bookworm/main`; `bookworm-security` currently offers `3.2.7-1+deb12u5`).
- `apt-cache show rsync` lists no `Recommends`, only hard `Depends`/`Pre-Depends`, so `--no-install-recommends` is a safe no-op for this package today (still worth adding for DL3015 compliance and to guard against future recommends).

Since the version is hard-pinned, this line will need a manual bump whenever Debian ships a further security update for `rsync` on bookworm (e.g. a future `+deb12u7`) — an unattended rebuild could otherwise fail once `3.2.7-1+deb12u6` is superseded/pruned from the mirror. Whoever bumps it should re-run `apt-cache policy rsync` against the then-current base image to pick the new candidate version, and verify the image still builds correctly after the change.

## Benefits
- Resolves both Codacy/Hadolint findings (DL3008, DL3015) on this line.
- Reproducible image builds: the exact `rsync` build installed is pinned and known.
- Slightly smaller image footprint by skipping recommended-but-unneeded packages.
