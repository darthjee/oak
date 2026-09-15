# Plan: Proxy — Tent multipart submit rule

Issue: [246-proxy-tent-multipart-submit-rule.md](../issues/246-proxy-tent-multipart-submit-rule.md)

## Overview

Introduce Oak's first Tent extension: a custom `RequestHandler`, mounted
via a new top-level `proxy/extension/loader.php`, that handles the
`multipart/form-data` "Submit" step of the photo upload flow.

See [proxy.md](proxy.md) for the full plan.
