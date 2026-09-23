# Plan: Add photo upload/delete rules to prod proxy config and deploy proxy extension

Issue: [330-versioned-prod-proxy-config-and-deploy-proxy-extension.md](../../issues/330-versioned-prod-proxy-config-and-deploy-proxy-extension.md)

## Overview
Add the photo submit and delete rules to the committed prod Tent config (`proxy/prod_configuration/`), with the new `$storageRoot` and `$maxUploadSizeBytes` locals, cover them in `ProdConfigurationRoutingTest`, and make `upload_proxy_files` deploy `proxy/extension/` so the photo handler classes exist in prod.

See [proxy.md](proxy.md) for the full plan.
