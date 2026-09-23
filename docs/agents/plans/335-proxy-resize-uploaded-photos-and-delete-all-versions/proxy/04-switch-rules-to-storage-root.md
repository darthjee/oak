# Switch rules to storageRoot
Pass the storage root, not the `origin/` folder, to both handlers, and drop the `// #335 switches this...` comments.

- Prod: `'storageRoot' => $storageRoot` in `proxy/prod_configuration/rules/uploads.php` and `deletes.php`.
- Dev: `'storageRoot' => '/tmp/photos'` in `docker_volumes/proxy_configuration/rules/uploads.php` and `deletes.php`.
- Update the file headers if they mention the origin folder.
- `proxy/extension_tests/ProdConfigurationRoutingTest.php` (around lines 170 and 179): assert the `storageRoot` property equals `self::STORAGE_ROOT`.
- Check the dev static rules for `/photos` and `/snaps` (from #332/#333) still point at `/tmp/photos/photos` and `/tmp/photos/snaps`, so dev serves the new files.

## Files to Change
- `proxy/prod_configuration/rules/uploads.php` — `storageRoot` option.
- `proxy/prod_configuration/rules/deletes.php` — `storageRoot` option.
- `docker_volumes/proxy_configuration/rules/uploads.php` — `storageRoot` option.
- `docker_volumes/proxy_configuration/rules/deletes.php` — `storageRoot` option.
- `proxy/extension_tests/ProdConfigurationRoutingTest.php` — assert `storageRoot`.
