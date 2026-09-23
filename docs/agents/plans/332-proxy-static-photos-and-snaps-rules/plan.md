# Plan: Proxy: static /photos and /snaps rules

Issue: [332-proxy-static-photos-and-snaps-rules.md](../../issues/332-proxy-static-photos-and-snaps-rules.md)

## Overview
Serve `/photos` and `/snaps` from the Oak proxy through static Tent rules in dev and prod. A new `Oak\Proxy\CacheControlMiddleware` adds a 7-day `Cache-Control` header to 2xx responses only. The work is entirely in the proxy agent's scope.

See [proxy.md](proxy.md) for the full plan.
